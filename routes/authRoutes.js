// routes/authRoutes.js
import express from 'express';
import { sendOtp, verifyOtpAndSignUp } from '../controllers/authController.js';


const router = express.Router();

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to a mobile number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: '1234567890'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Mobile number is required
 *       500:
 *         description: Failed to send OTP
 */
router.post('/send-otp', sendOtp);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and sign up or log in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobileNumber
 *               - otp
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: '1234567890'
 *               otp:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       201:
 *         description: Authentication successful
 *       400:
 *         description: Mobile number and OTP are required or OTP is invalid
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', verifyOtpAndSignUp);

// In a full application, you would also have a route to refresh the access token
// router.post('/refresh-token', refreshTokenController);

export default router;