// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  countryCode: {
    type: String,
    required: [true, 'Country code is required.'],
    enum: ['91', '1', '44', '86', '33', '49', '81', '61'],
    trim: true,
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required.'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    },
  },
  
  // --- Profile Fields ---
  fullName: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  
}, {
  timestamps: true
});

userSchema.index({ countryCode: 1, mobileNumber: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;