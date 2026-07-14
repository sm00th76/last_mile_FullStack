import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    channel: { type: String, enum: ['email'], default: 'email' },
    recipient: { type: String, required: true },
    subject: String,
    status: { type: String, enum: ['sent', 'failed'], required: true },
    error: String,
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
