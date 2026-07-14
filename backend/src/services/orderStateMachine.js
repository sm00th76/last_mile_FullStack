/**
 * Order State Machine
 *
 * Defines the explicit transition map for order statuses and enforces
 * that only legal transitions can occur. Every transition writes a
 * TrackingEvent and triggers a notification.
 *
 * Transition Map:
 *   Created → Assigned → PickedUp → InTransit → OutForDelivery → Delivered
 *                                                                → Failed → Rescheduled → Assigned (loop)
 *   * → Cancelled (admin only)
 *
 * Admin has a separate forceStatus() path that bypasses the map but
 * STILL writes a TrackingEvent (flagged as override) — never skip the audit trail.
 */

import TrackingEvent from '../models/TrackingEvent.js';
import { notifyStatusChange } from './notificationService.js';

/**
 * Legal transitions: currentStatus → [allowed next statuses]
 */
const TRANSITION_MAP = {
  Created: ['Assigned', 'Cancelled'],
  Assigned: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'Cancelled'],
  InTransit: ['OutForDelivery', 'Cancelled'],
  OutForDelivery: ['Delivered', 'Failed', 'Cancelled'],
  Failed: ['Rescheduled', 'Cancelled'],
  Rescheduled: ['Assigned', 'Cancelled'],
  // Terminal states — no further transitions (except admin force)
  Delivered: ['Cancelled'],
  Cancelled: [],
};

/**
 * Check if a transition is legal.
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export const isValidTransition = (currentStatus, newStatus) => {
  const allowed = TRANSITION_MAP[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
};

/**
 * Get the list of allowed next statuses from the current status.
 *
 * @param {string} currentStatus
 * @returns {string[]}
 */
export const getAllowedTransitions = (currentStatus) => {
  return TRANSITION_MAP[currentStatus] || [];
};

/**
 * Perform a validated state transition.
 * Rejects illegal transitions with a 400 error.
 * Writes a TrackingEvent and triggers a notification.
 *
 * @param {Object} order - Mongoose order document
 * @param {string} newStatus - Target status
 * @param {Object} actor - { id, role } of the person making the change
 * @param {string} [note] - Optional note (e.g., failure reason)
 * @param {Object} [location] - Optional { lat, lng }
 * @returns {Object} Updated order
 */
export const transition = async (order, newStatus, actor, note = '', location = null) => {
  if (!isValidTransition(order.status, newStatus)) {
    const err = new Error(
      `Invalid status transition: ${order.status} → ${newStatus}. ` +
        `Allowed transitions: ${getAllowedTransitions(order.status).join(', ') || 'none'}`
    );
    err.statusCode = 400;
    throw err;
  }

  const previousStatus = order.status;
  order.status = newStatus;
  await order.save();

  // Write append-only tracking event
  await TrackingEvent.create({
    orderId: order._id,
    status: newStatus,
    actor: { id: actor.id, role: actor.role },
    note: note || `Status changed from ${previousStatus} to ${newStatus}`,
    location,
    isOverride: false,
  });

  // Fire notification (non-blocking — errors are caught internally)
  notifyStatusChange(order, newStatus, note).catch(() => {});

  return order;
};

/**
 * Admin force-status — bypasses the transition map but STILL writes
 * a TrackingEvent flagged as an override. Never skip the audit trail.
 *
 * @param {Object} order - Mongoose order document
 * @param {string} newStatus - Any valid order status
 * @param {Object} actor - { id, role } — must be admin
 * @param {string} [note] - Reason for the override
 * @returns {Object} Updated order
 */
export const forceStatus = async (order, newStatus, actor, note = '') => {
  const validStatuses = [
    'Created', 'Assigned', 'PickedUp', 'InTransit',
    'OutForDelivery', 'Delivered', 'Failed', 'Rescheduled', 'Cancelled',
  ];

  if (!validStatuses.includes(newStatus)) {
    const err = new Error(`Invalid status: ${newStatus}`);
    err.statusCode = 400;
    throw err;
  }

  const previousStatus = order.status;
  order.status = newStatus;
  await order.save();

  // Write tracking event flagged as admin override
  await TrackingEvent.create({
    orderId: order._id,
    status: newStatus,
    actor: { id: actor.id, role: actor.role },
    note: note || `Admin override: ${previousStatus} → ${newStatus}`,
    isOverride: true,
  });

  // Fire notification
  notifyStatusChange(order, newStatus, note).catch(() => {});

  return order;
};
