// models/userModel.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // --- Core Authentication Field ---
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required.'],
    unique: true,
    trim: true,
    index: true,
  },

  // --- NEW PROFILE FIELDS ---
  // These fields are not required at signup and can be added later.
  fullName: {
    type: String,
    trim: true,
    default: '' // Defaults to an empty string
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    
    // 'sparse: true' is essential for optional unique fields.
    // It allows multiple documents to have a null/empty email,
    // but ensures that any email that IS provided is unique.
    sparse: true,
    // Basic regex for email format validation
    match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please provide a valid email'],
  },
  dateOfBirth: {
    type: Date, // Stores the date of birth
    default: Date.now ,// Defaults to an empty string
  },
  gender: {
    type: String,
    // 'enum' restricts the possible values for this field
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    default: 'Other', // Defaults to an empty string
  },
  
}, {
  timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

const User = mongoose.model('User', userSchema);

export default User;