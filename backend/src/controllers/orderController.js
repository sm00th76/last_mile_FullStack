/**
 * Order Controller
 *
 * Handles all order-related endpoints:
 *   - Quote (price preview)
 *   - Create order
 *   - Get customer's orders
 *   - Get single order
 *   - Get tracking timeline
 *   - Update status (agent)
 *   - Manual assign (admin)
 *   - Force override (admin)
 *   - Reschedule (customer)
 *   - Get all orders (admin, with filters)
 */

import Order from '../models/Order.js';
import TrackingEvent from '../models/TrackingEvent.js';
import Agent from '../models/Agent.js';
import { calculateCharge } from '../services/rateEngine.js';
import { autoAssign, manualAssign } from '../services/assignmentEngine.js';
import { transition, forceStatus, getAllowedTransitions } from '../services/orderStateMachine.js';
import { notifyStatusChange } from '../services/notificationService.js';
import { generateOrderNumber } from '../utils/helpers.js';

/**
 * POST /orders/quote
 * Run rate engine only — no order created. Returns pricing breakdown.
 */
export const getQuote = async (req, res, next) => {
  try {
    const {
      pickupPincode, dropPincode, orderType, paymentType,
      length, breadth, height, actualWeight,
    } = req.body;

    const pricing = await calculateCharge({
      pickupPincode, dropPincode, orderType, paymentType,
      length, breadth, height, actualWeight,
    });

    res.json({
      quote: {
        rateType: pricing.rateType,
        volumetricWeight: pricing.volumetricWeight,
        chargeableWeight: pricing.chargeableWeight,
        baseCharge: pricing.baseCharge,
        codSurcharge: pricing.codSurcharge,
        totalCharge: pricing.totalCharge,
        rateCardDetails: pricing.rateCardDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /orders
 * Create a new order with pricing snapshot.
 * Customer creates for themselves; admin can create on behalf of any customer.
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderType, paymentType,
      pickupAddress, dropAddress,
      length, breadth, height, actualWeight,
      customerId, // Only used by admin creating on behalf
    } = req.body;

    // Determine the actual customer
    const effectiveCustomerId = req.user.role === 'admin' && customerId
      ? customerId
      : req.user.id;

    // Run rate engine to get pricing
    const pricing = await calculateCharge({
      pickupPincode: pickupAddress.pincode,
      dropPincode: dropAddress.pincode,
      orderType,
      paymentType,
      length, breadth, height, actualWeight,
    });

    // Create order with snapshot of pricing (later rate card edits don't affect this order)
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId: effectiveCustomerId,
      createdBy: req.user.id,
      orderType,
      paymentType,
      pickupAddress: {
        line: pickupAddress.line,
        pincode: pickupAddress.pincode,
        zoneId: pricing.pickupZoneId,
      },
      dropAddress: {
        line: dropAddress.line,
        pincode: dropAddress.pincode,
        zoneId: pricing.dropZoneId,
      },
      package: {
        length, breadth, height, actualWeight,
        volumetricWeight: pricing.volumetricWeight,
        chargeableWeight: pricing.chargeableWeight,
      },
      pricing: {
        baseCharge: pricing.baseCharge,
        codSurcharge: pricing.codSurcharge,
        totalCharge: pricing.totalCharge,
        rateCardUsed: pricing.rateCardUsed,
      },
      status: 'Created',
    });

    // Write first tracking event
    await TrackingEvent.create({
      orderId: order._id,
      status: 'Created',
      actor: { id: req.user.id, role: req.user.role },
      note: 'Order created',
    });

    // Fire notification
    notifyStatusChange(order, 'Created').catch(() => {});

    // Attempt auto-assignment
    try {
      await autoAssign(order, { id: req.user.id, role: 'system' });
    } catch (assignErr) {
      // Auto-assignment failure is non-fatal — order is still created
      console.log(`⚠️ Auto-assignment skipped: ${assignErr.message}`);
    }

    // Reload order with populated refs
    const populatedOrder = await Order.findById(order._id)
      .populate('customerId', 'name email')
      .populate('assignedAgentId');

    res.status(201).json({ order: populatedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/mine
 * Customer's own orders, or agent's assigned orders.
 */
export const getMyOrders = async (req, res, next) => {
  try {
    let filter;

    if (req.user.role === 'agent') {
      // For agents, return orders assigned to them
      const agent = await Agent.findOne({ userId: req.user.id });
      if (!agent) {
        return res.json({ orders: [] });
      }
      filter = { assignedAgentId: agent._id };
    } else {
      // For customers, return their own orders
      filter = { customerId: req.user.id };
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'assignedAgentId', populate: { path: 'userId', select: 'name email phone' } })
      .populate('customerId', 'name email')
      .lean();

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:id
 * Get single order (customer sees own, admin sees any, agent sees assigned).
 */
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate({ path: 'assignedAgentId', populate: { path: 'userId', select: 'name email phone' } })
      .populate('pricing.rateCardUsed');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control: customer sees own, agent sees assigned, admin sees all
    if (req.user.role === 'customer' && !order.customerId._id.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'agent') {
      const agent = await Agent.findOne({ userId: req.user.id });
      if (!agent || !order.assignedAgentId || !order.assignedAgentId._id.equals(agent._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders/:id/tracking
 * Full immutable timeline of tracking events.
 */
export const getTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control
    if (req.user.role === 'customer' && !order.customerId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const events = await TrackingEvent.find({ orderId: req.params.id })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:id/status
 * Agent updates order status (validated by state machine).
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { status, note, location } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify agent is assigned to this order
    if (req.user.role === 'agent') {
      const agent = await Agent.findOne({ userId: req.user.id });
      if (!agent || !order.assignedAgentId || !order.assignedAgentId.equals(agent._id)) {
        return res.status(403).json({ error: 'You are not assigned to this order' });
      }
    }

    // Use state machine to validate and execute transition
    const updatedOrder = await transition(
      order,
      status,
      { id: req.user.id, role: req.user.role },
      note,
      location
    );

    // If order is delivered or cancelled, decrement agent's active order count
    if (['Delivered', 'Cancelled', 'Failed'].includes(status)) {
      if (order.assignedAgentId) {
        const agent = await Agent.findById(order.assignedAgentId);
        if (agent && agent.activeOrderCount > 0) {
          agent.activeOrderCount -= 1;
          if (agent.status === 'busy') {
            agent.status = 'available';
          }
          await agent.save();
        }
      }
    }

    res.json({
      order: updatedOrder,
      allowedTransitions: getAllowedTransitions(updatedOrder.status),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:id/assign
 * Admin manually assigns an agent to an order.
 */
export const assignOrder = async (req, res, next) => {
  try {
    const { agentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await manualAssign(
      order,
      agentId,
      { id: req.user.id, role: req.user.role }
    );

    res.json({ order: result.order, agent: result.agent });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /orders/:id/override
 * Admin force-status — bypasses state machine, still logs TrackingEvent.
 */
export const overrideStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await forceStatus(
      order,
      status,
      { id: req.user.id, role: req.user.role },
      note
    );

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /orders/:id/reschedule
 * Customer reschedules a failed delivery.
 */
export const rescheduleOrder = async (req, res, next) => {
  try {
    const { newDate, reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only the customer who owns the order can reschedule
    if (req.user.role === 'customer' && !order.customerId.equals(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Order must be in Failed status to reschedule
    if (order.status !== 'Failed') {
      return res.status(400).json({
        error: `Cannot reschedule: order is in "${order.status}" status. Only "Failed" orders can be rescheduled.`,
      });
    }

    // Push to reschedule history
    order.rescheduleHistory.push({
      newDate: new Date(newDate),
      reason,
      rescheduledAt: new Date(),
      rescheduledBy: req.user.id,
    });

    // Transition to Rescheduled
    order.status = 'Rescheduled';
    await order.save();

    // Write tracking event
    await TrackingEvent.create({
      orderId: order._id,
      status: 'Rescheduled',
      actor: { id: req.user.id, role: req.user.role },
      note: `Rescheduled for ${newDate}. Reason: ${reason || 'N/A'}`,
    });

    // Notify
    notifyStatusChange(order, 'Rescheduled', reason).catch(() => {});

    // Re-trigger auto-assignment
    try {
      await autoAssign(order, { id: req.user.id, role: 'system' });
    } catch (assignErr) {
      console.log(`⚠️ Auto-assignment after reschedule skipped: ${assignErr.message}`);
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('assignedAgentId');

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /orders (admin)
 * All orders with optional filters: status, zone, agent.
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, zoneId, agentId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (agentId) filter.assignedAgentId = agentId;
    if (zoneId) {
      filter.$or = [
        { 'pickupAddress.zoneId': zoneId },
        { 'dropAddress.zoneId': zoneId },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customerId', 'name email')
        .populate({ path: 'assignedAgentId', populate: { path: 'userId', select: 'name email phone' } })
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
