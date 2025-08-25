// models/otpModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

otpSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;