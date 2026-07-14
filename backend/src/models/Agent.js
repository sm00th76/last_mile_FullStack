import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    activeOrderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
