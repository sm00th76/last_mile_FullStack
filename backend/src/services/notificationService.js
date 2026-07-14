/**
 * Notification Service
 *
 * Sends email notifications on order status changes.
 * Logs every attempt (success or failure) in the Notification collection.
 *
 * SMS is excluded per requirements.
 * If SMTP is not configured, emails are logged as no-ops but the core flow never breaks.
 */

import { sendMail } from '../config/mailer.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Status-to-subject mapping for email notifications.
 */
const STATUS_SUBJECTS = {
  Created: 'Order Created',
  Assigned: 'Agent Assigned to Your Order',
  PickedUp: 'Order Picked Up',
  InTransit: 'Order In Transit',
  OutForDelivery: 'Order Out for Delivery',
  Delivered: 'Order Delivered Successfully',
  Failed: 'Delivery Attempt Failed',
  Rescheduled: 'Order Rescheduled',
  Cancelled: 'Order Cancelled',
};

/**
 * Generate HTML email body for a status update.
 */
const generateEmailHtml = (order, status, note) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Delivery Tracker — Order Update</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${status}</span></p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        <p><strong>Order Type:</strong> ${order.orderType} | ${order.paymentType}</p>
        <hr style="border: 1px solid #ddd;" />
        <p><strong>Pickup:</strong> ${order.pickupAddress.line} (${order.pickupAddress.pincode})</p>
        <p><strong>Drop:</strong> ${order.dropAddress.line} (${order.dropAddress.pincode})</p>
        ${order.pricing ? `<p><strong>Total Charge:</strong> ₹${order.pricing.totalCharge}</p>` : ''}
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">
        This is an automated notification from Delivery Tracker.
      </p>
    </div>
  `;
};

/**
 * Send an order status notification email to the customer.
 * Always logs the attempt in the Notification collection.
 *
 * @param {Object} order - Mongoose order document
 * @param {string} status - New status
 * @param {string} [note] - Optional note (e.g., failure reason)
 */
export const notifyStatusChange = async (order, status, note = '') => {
  try {
    // Look up the customer's email
    const customer = await User.findById(order.customerId);
    if (!customer) {
      console.warn(`⚠️ Cannot notify: customer ${order.customerId} not found`);
      return;
    }

    const subject = `${STATUS_SUBJECTS[status] || 'Order Update'} — ${order.orderNumber}`;
    const html = generateEmailHtml(order, status, note);

    // Attempt to send email
    const result = await sendMail(customer.email, subject, html);

    // Log the notification attempt
    await Notification.create({
      orderId: order._id,
      channel: 'email',
      recipient: customer.email,
      subject,
      status: result.success ? 'sent' : 'failed',
      error: result.error || undefined,
      sentAt: new Date(),
    });
  } catch (error) {
    // Never let notification failures break the core flow
    console.error(`⚠️ Notification error for order ${order.orderNumber}: ${error.message}`);

    // Still try to log the failure
    try {
      await Notification.create({
        orderId: order._id,
        channel: 'email',
        recipient: 'unknown',
        subject: `Status: ${status}`,
        status: 'failed',
        error: error.message,
      });
    } catch (logErr) {
      console.error(`⚠️ Failed to log notification: ${logErr.message}`);
    }
  }
};
