import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const otpSchema = new mongoose.Schema({
  mobileNumber: { type: Number, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});
otpSchema.pre('save', async function (next) {
  if (!this.isModified('otp')) return next();
  // const salt = await bcrypt.genSalt(10);
  // this.otp = await bcrypt.hash(this.otp, salt);
  next();
});
const Otp = mongoose.model('Otp', otpSchema);
export default Otp;