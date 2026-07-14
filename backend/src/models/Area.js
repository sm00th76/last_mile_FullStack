import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
  },
  { timestamps: true }
);

areaSchema.index({ pincode: 1 });

const Area = mongoose.model('Area', areaSchema);
export default Area;
