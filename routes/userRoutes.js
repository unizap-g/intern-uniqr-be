import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';

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

// Dynamic user route: get user by ID (protected)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v -createdAt -updatedAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.', error: error.message });
  }
});

export default router;
