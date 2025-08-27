import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getUserProfile, getUserById, signOut, updateUserProfile } from '../controllers/userController.js';

const router = express.Router();

// =================================================================
// User Routes - All routes require authentication
// =================================================================

/**
 * @route   GET /api/user/profile
 * @desc    Get current authenticated user's profile
 * @access  Private (requires valid access token)
 */
router.get('/profile', authenticate, getUserProfile);

/**
 * @route   GET /api/user/:id
 * @desc    Get user by ID
 * @access  Private (requires valid access token)
 */
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUserProfile);
/**
 * @route   POST /api/user/:id/signout
 * @desc    Sign out specific user by invalidating their refresh token
 * @access  Private (user can only sign out themselves)
 */
router.post('/:id/signout', authenticate, signOut);

export default router;
