import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderType: { type: String, enum: ['B2B', 'B2C'], required: true },
    paymentType: { type: String, enum: ['Prepaid', 'COD'], required: true },
    pickupAddress: {
      line: { type: String, required: true },
      pincode: { type: String, required: true },
      zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    },
    dropAddress: {
      line: { type: String, required: true },
      pincode: { type: String, required: true },
      zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
    },
    package: {
      length: { type: Number, required: true },
      breadth: { type: Number, required: true },
      height: { type: Number, required: true },
      actualWeight: { type: Number, required: true },
      volumetricWeight: Number,
      chargeableWeight: Number,
    },
    pricing: {
      baseCharge: Number,
      codSurcharge: { type: Number, default: 0 },
      totalCharge: Number,
      rateCardUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'RateCard' },
    },
    status: {
      type: String,
      enum: [
        'Created',
        'Assigned',
        'PickedUp',
        'InTransit',
        'OutForDelivery',
        'Delivered',
        'Failed',
        'Rescheduled',
        'Cancelled',
      ],
      default: 'Created',
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
    },
    rescheduleHistory: [
      {
        newDate: { type: Date, required: true },
        reason: String,
        rescheduledAt: { type: Date, default: Date.now },
        rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ assignedAgentId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
