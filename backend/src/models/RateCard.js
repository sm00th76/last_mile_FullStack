import mongoose from 'mongoose';

const rateCardSchema = new mongoose.Schema(
  {
    orderType: { type: String, enum: ['B2B', 'B2C'], required: true },
    rateType: {
      type: String,
      enum: ['intra-zone', 'inter-zone'],
      required: true,
    },
    baseRate: { type: Number, required: true },
    perKgRate: { type: Number, required: true },
    minCharge: { type: Number, required: true },
    volumetricDivisor: { type: Number, default: 5000 },
    codSurchargeFlat: { type: Number, default: 0 },
    codSurchargePercent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rateCardSchema.index({ orderType: 1, rateType: 1 });

const RateCard = mongoose.model('RateCard', rateCardSchema);
export default RateCard;
