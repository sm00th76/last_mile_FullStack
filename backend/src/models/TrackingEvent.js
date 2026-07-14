/**
 * TrackingEvent — Append-only / Immutable collection.
 *
 * Events in this collection are only CREATED, never updated or deleted.
 * This guarantees a tamper-proof audit trail for every order status change.
 * The schema intentionally disables `updatedAt` to reinforce immutability.
 */

import mongoose from 'mongoose';

const trackingEventSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    status: { type: String, required: true },
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: {
        type: String,
        enum: ['customer', 'agent', 'admin', 'system'],
      },
    },
    note: String,
    location: {
      lat: Number,
      lng: Number,
    },
    isOverride: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TrackingEvent = mongoose.model('TrackingEvent', trackingEventSchema);
export default TrackingEvent;
