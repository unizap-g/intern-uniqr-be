import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v -createdAt -updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'Authenticated user profile', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v -createdAt -updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.', error: error.message });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // security check: only the logged-in user can update their own profile
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { fullName, email, dateOfBirth, gender, profilePicture, password } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user profile', error: error.message });
  }
};

export const signOut = async (req, res) => {
  try {
    const userId = req.params.id;
    const { refreshToken } = req.body;
    
    // Verify the user making the request matches the user being signed out
    // or has appropriate permissions
    if (req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only sign out your own account.' 
      });
    }
    
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required.' 
      });
    }
    
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // Even if token is invalid/expired, respond with success to avoid leaking info
      return res.status(200).json({ 
        success: true, 
        message: 'User signed out successfully.',
        shouldRedirect: true 
      });
    }
    
    // Verify the token belongs to the user being signed out
    if (payload.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token does not belong to this user.' 
      });
    }
    
    // Remove refresh token from Redis
    const redis = req.app.get('redis');
    const redisKey = `refreshToken:${userId}`;
    await redis.del(redisKey);
    
    // Respond to client to clear tokens and redirect to login
    res.status(200).json({ 
      success: true, 
      message: 'User signed out successfully.',
      shouldRedirect: true,
      userId: userId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Could not sign out user.', 
      error: error.message 
    });
  }
};
