import { Router } from 'express';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import {
  getQuote,
  createOrder,
  getMyOrders,
  getOrder,
  getTracking,
  updateStatus,
  assignOrder,
  overrideStatus,
  rescheduleOrder,
  getAllOrders,
} from '../controllers/orderController.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * POST /orders/quote
 * Get a price quote without creating an order.
 * Allowed: customer, admin
 */
router.post(
  '/quote',
  authorize('customer', 'admin'),
  [
    body('pickupPincode').notEmpty().withMessage('Pickup pincode is required'),
    body('dropPincode').notEmpty().withMessage('Drop pincode is required'),
    body('orderType').isIn(['B2B', 'B2C']).withMessage('Order type must be B2B or B2C'),
    body('paymentType').isIn(['Prepaid', 'COD']).withMessage('Payment type must be Prepaid or COD'),
    body('length').isFloat({ gt: 0 }).withMessage('Length must be positive'),
    body('breadth').isFloat({ gt: 0 }).withMessage('Breadth must be positive'),
    body('height').isFloat({ gt: 0 }).withMessage('Height must be positive'),
    body('actualWeight').isFloat({ gt: 0 }).withMessage('Actual weight must be positive'),
  ],
  validate,
  getQuote
);

/**
 * POST /orders
 * Create a new order.
 * Allowed: customer, admin (admin can create on behalf of customer)
 */
router.post(
  '/',
  authorize('customer', 'admin'),
  [
    body('orderType').isIn(['B2B', 'B2C']).withMessage('Order type must be B2B or B2C'),
    body('paymentType').isIn(['Prepaid', 'COD']).withMessage('Payment type must be Prepaid or COD'),
    body('pickupAddress.line').notEmpty().withMessage('Pickup address line is required'),
    body('pickupAddress.pincode').notEmpty().withMessage('Pickup pincode is required'),
    body('dropAddress.line').notEmpty().withMessage('Drop address line is required'),
    body('dropAddress.pincode').notEmpty().withMessage('Drop pincode is required'),
    body('length').isFloat({ gt: 0 }).withMessage('Length must be positive'),
    body('breadth').isFloat({ gt: 0 }).withMessage('Breadth must be positive'),
    body('height').isFloat({ gt: 0 }).withMessage('Height must be positive'),
    body('actualWeight').isFloat({ gt: 0 }).withMessage('Actual weight must be positive'),
  ],
  validate,
  createOrder
);

/**
 * GET /orders/mine
 * Customer's own orders.
 * Allowed: customer
 */
router.get('/mine', authorize('customer', 'agent'), getMyOrders);

/**
 * GET /orders
 * All orders with filters (admin only).
 * Allowed: admin
 */
router.get(
  '/',
  authorize('admin'),
  getAllOrders
);

/**
 * GET /orders/:id
 * Get a single order.
 * Allowed: customer (own), agent (assigned), admin (any)
 */
router.get('/:id', authorize('customer', 'agent', 'admin'), getOrder);

/**
 * GET /orders/:id/tracking
 * Full immutable tracking timeline.
 * Allowed: customer (own), agent (assigned), admin (any)
 */
router.get('/:id/tracking', authorize('customer', 'agent', 'admin'), getTracking);

/**
 * PATCH /orders/:id/status
 * Agent updates order status (validated by state machine).
 * Allowed: agent, admin
 */
router.patch(
  '/:id/status',
  authorize('agent', 'admin'),
  [
    body('status').notEmpty().withMessage('Status is required'),
    body('note').optional().isString(),
  ],
  validate,
  updateStatus
);

/**
 * PATCH /orders/:id/assign
 * Admin manually assigns an agent to an order.
 * Allowed: admin
 */
router.patch(
  '/:id/assign',
  authorize('admin'),
  [body('agentId').notEmpty().withMessage('Agent ID is required')],
  validate,
  assignOrder
);

/**
 * PATCH /orders/:id/override
 * Admin force-status override (bypasses state machine).
 * Allowed: admin
 */
router.patch(
  '/:id/override',
  authorize('admin'),
  [
    body('status').notEmpty().withMessage('Status is required'),
    body('note').optional().isString(),
  ],
  validate,
  overrideStatus
);

/**
 * POST /orders/:id/reschedule
 * Customer reschedules a failed delivery.
 * Allowed: customer, admin
 */
router.post(
  '/:id/reschedule',
  authorize('customer', 'admin'),
  [
    body('newDate').notEmpty().withMessage('New date is required'),
    body('reason').optional().isString(),
  ],
  validate,
  rescheduleOrder
);

export default router;
