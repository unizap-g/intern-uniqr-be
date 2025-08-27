// routes/authRoutes.js

import express from 'express';
import { sendOtp, verifyOtpAndSignUp, signOut } from '../controllers/authController.js';

// Accept otpRateLimiter as a parameter
export function createAuthRoutes(otpRateLimiter) {
  const router = express.Router();
  
  // Import middleware and controllers dynamically
  import('../middleware/authMiddleware.js').then(({ authenticate }) => {
    // Example protected route
    router.get('/protected', authenticate, (req, res) => {
      res.status(200).json({ success: true, message: 'You are authenticated!', userId: req.user.id });
    });

    /**
     * @route   POST /api/auth/signout
     * @desc    Signs out the user by invalidating their session and removing refresh token from Redis.
     * @access  Private - Requires valid JWT access token
     * @middleware authenticate - Validates the user's access token
     */
    router.post('/signout', authenticate, signOut);
  });

  import('../controllers/tokenController.js').then(({ refreshAccessToken }) => {
    router.post('/refresh-token', refreshAccessToken);
  });

  // =================================================================
  // Authentication Routes
  // =================================================================

  /**
   * @route   POST /api/auth/send-otp
   * @desc    Initiates the sign-up or sign-in process by sending an OTP.
   * @access  Public
   * @middleware otpRateLimiter - Applies a strict rate limit to this expensive endpoint.
   */
  router.post('/send-otp', otpRateLimiter, sendOtp);

  /**
   * @route   POST /api/auth/verify-otp
   * @desc    Completes authentication by verifying the OTP and issuing tokens.
   * @access  Public
   * @middleware generalRateLimiter - Protected by the global limiter in server.js.
   */
  router.post('/verify-otp', verifyOtpAndSignUp);

<<<<<<< HEAD
=======

  // Refresh token endpoint
  import('../controllers/tokenController.js').then(({ refreshAccessToken, logout }) => {
    router.post('/refresh-token', refreshAccessToken);
    
    /**
     * @route   POST /api/auth/logout
     * @desc    Logs out user by invalidating refresh token from Redis
     * @access  Public (requires refresh token in body)
     */
    router.post('/logout', logout);
  });

>>>>>>> 685a6e7df45b7cae1dffdeab3d66a21f25990569
  // Export the router for use in server.js
  return router;
}