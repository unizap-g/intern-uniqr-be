// routes/authRoutes.js

import express from 'express';
import { sendOtp, verifyOtpAndSignUp, signOut, exchangeApiKeyForTokens } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { refreshAccessToken } from '../controllers/tokenController.js';

// Accept rate limiters as parameters
export function createAuthRoutes(otpRateLimiter, generalRateLimiter) {
  const router = express.Router();

  // =================================================================
  // Authentication Routes
  // =================================================================

  router.get('/check-auth', authenticate, (req, res) => {
      if(req.user && req.user.id){
        return res.status(200).json({
          success: true,
          message: "User is authenticated.",
          userId: req.user.id
        });
      }
      return res.status(401).json({
        success: false,
        message: "User is not authenticated."
      });
    });

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
   */
  router.post('/verify-otp', generalRateLimiter, verifyOtpAndSignUp);

  /**
   * @route   POST /api/auth/exchange-tokens
   * @desc    Exchange UUID API key for actual JWT tokens.
   * @access  Public
   */
  router.post('/exchange-tokens', generalRateLimiter, exchangeApiKeyForTokens);

  /**
   * @route   POST /api/auth/refresh-token
   * @desc    Refresh access token using refresh token.
   * @access  Public
   */
  router.post('/refresh-token', refreshAccessToken);

  /**
   * @route   POST /api/auth/signout
   * @desc    Signs out the user by invalidating their session and removing refresh token from Redis.
   * @access  Private - Requires valid JWT access token
   * @middleware authenticate - Validates the user's access token
   */
  router.post('/signout', (req, res, next) => {
    // Ensure req.body exists for signout (no parameters needed)
    if (!req.body) {
      req.body = {};
    }
    next();
  }, authenticate, signOut);

  /**
   * @route   GET /api/auth/protected
   * @desc    Test protected route
   * @access  Private
   */
  router.get('/protected', authenticate, (req, res) => {
    res.status(200).json({ success: true, message: 'You are authenticated!', userId: req.user.id });
  });

  

  // Export the router for use in server.js
  return router;
}