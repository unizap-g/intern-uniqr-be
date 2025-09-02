import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';
const router = express.Router();

// Example: Authenticated user profile endpoint

import User from '../models/userModel.js';

// Authenticated user profile (current user)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v -createdAt -updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'Authenticated user profile', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.', error: error.message });
  }
});

// Update user profile - Enhanced version
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const allowedFields = ['fullName', 'email', 'dateOfBirth', 'gender', 'firstName', 'lastName', 'isActive'];
    const updateData = {};
    const errors = [];
    
    // Validate and process each field
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        const value = req.body[key];
        
        // Field-specific validation
        switch(key) {
          case 'fullName':
            // Only allow alphabets and spaces, no numbers or special characters
            const nameRegex = /^[a-zA-Z\s]+$/;
            if (typeof value === 'string' && value.trim().length >= 2 && nameRegex.test(value.trim())) {
              updateData[key] = value.trim();
            } else {
              errors.push('Full name must be at least 2 characters long and contain only alphabets and spaces');
            }
            break;
            
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value === 'string' && emailRegex.test(value)) {
              updateData[key] = value.toLowerCase().trim();
            } else {
              errors.push('Please provide a valid email address');
            }
            break;
            
          case 'dateOfBirth':
            const dobRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (typeof value === 'string' && dobRegex.test(value)) {
              const [day, month, year] = value.split('-').map(Number);
              const date = new Date(year, month - 1, day);
              const today = new Date();
              const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
              const maxAge = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
              
              if (!isNaN(date.getTime()) && date <= minAge && date >= maxAge) {
                updateData[key] = date;
              } else {
                errors.push('Date of birth must be valid and user must be between 13-120 years old');
              }
            } else {
              errors.push('Date of birth must be in dd-mm-yyyy format');
            }
            break;
        }
      } else {
        errors.push(`Field '${key}' is not allowed for update`);
      }
    });


    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors,
        allowedFields
      });
    }

 
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields provided for update',
        allowedFields,
        example: {
          fullName: "John Doe",
          email: "john@example.com",
          dateOfBirth: "1990-01-15",
          gender: "Male"
        }
      });
    }


    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: req.user.id } 
      });
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email is already registered with another account' 
        });
      }
    }


    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully', 
      user: {
        ...user.toObject(),
        dateOfBirth: formatDate(user.dateOfBirth)
  },
      updatedFields: Object.keys(updateData)
    });
    
  } catch (error) {

    if (error.name === 'ValidationError') {
      const mongoErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: mongoErrors
      });
    }
    

    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email is already registered with another account' 
      });
    }
    
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
});


router.get('/userdata', authenticate, async (req, res) => {
  console.log("u are here means verified");
  const userId = req.user.id;
  const uuidToken=req.user.apiKey;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }
  const isValid = mongoose.Types.ObjectId.isValid(userId);
  if(!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    
  }
  try {
    const user = await User.findById(userId).select('-__v -createdAt -updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user , message: 'User fetched successfully.',userId:userId ,uuidToken:uuidToken});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.', error: error.message });
  }
});

export default router;
