// // models/userModel.js
// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//   countryCode: {
//     type: String,
//     required: [true, 'Country code is required.'],
//     enum: ['91', '1', '44', '86', '33', '49', '81', '61'],
//     trim: true,
//   },
//   mobileNumber: {
//     type: String,
//     required: [true, 'Mobile number is required.'],
//     trim: true,
//     validate: {
//       validator: function(v) {
//         return /^\d{10}$/.test(v);
//       },
//       message: props => `${props.value} is not a valid 10-digit mobile number!`
//     },
//   },

//   // --- Profile Fields ---
//   fullName: { type: String, trim: true, default: '' },
//   email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
//   dateOfBirth: { type: Date },
//   gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },

// }, {
//   timestamps: true
// });

// userSchema.index({ countryCode: 1, mobileNumber: 1 }, { unique: true });

// const User = mongoose.model('User', userSchema);
// export default User;

// models/userModel.js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    allQr: [
      {
        qrlist: { type: mongoose.Schema.Types.ObjectId, ref: "QRCode" },
      },
    ],
    // --- Auth Fields ---
    countryCode: {
      type: Number,
      required: [true, "Country code is required."],
      enum: [91, 1, 44, 61], // fixed: should be numbers, not strings
      trim: true,
    },
    mobileNumber: {
      type: String, // string for regex validation
      required: [true, "Mobile number is required."],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit mobile number!`,
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      // required: true,
    },
    password: {
      type: String,
      // required: true,
    },
    // --- Profile Fields ---
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    // fullName: { type: String, trim: true, default: '' }, // keep for flexibility
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    profilePhoto: { type: String, default: "" },
    // --- Subscription / QR Info ---
    subscription: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    qrCodesCreated: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
// Unique index for phone number
userSchema.index({ countryCode: 1, mobileNumber: 1 }, { unique: true });
// Email index
userSchema.index({ email: 1 });
const User = mongoose.model("User", userSchema);
export default User;
