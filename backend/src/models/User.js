import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      default: 'customer',
    },
    phone: { type: String, trim: true },
    addresses: [
      {
        label: String,
        line: String,
        pincode: String,
      },
    ],
    refreshToken: String,
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
