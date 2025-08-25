// controllers/authController.js
import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import { sendOtpSms } from "../services/smsService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";

// =================================================================
// UPDATED sendOtp function - The user existence check has been REMOVED from here.
// Its only job now is to send an OTP.
// =================================================================
export const sendOtp = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number is required." });
    }

    // The function is now simpler. It just generates, sends, and saves the OTP.
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const smsSent = await sendOtpSms(mobileNumber, otp);
    if (!smsSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP." });
    }

    // The robust OTP creation from your provided code is kept.
    try {
      const newOtp = new Otp({ mobileNumber, otp });
      await newOtp.save();
      console.log(`✅ OTP for ${mobileNumber} successfully stored in MongoDB.`);
    } catch (dbError) {
      console.error('❌ MongoDB Error: Failed to store OTP.', dbError);
      return res.status(500).json({
        success: false,
        message: 'A database error occurred while trying to save the OTP.'
      });
    }
    
    // The response is now always the same, simple success message.
    // The `userExists` flag is no longer sent from here.
    res.status(200).json({
      success: true,
      message: "OTP has been sent successfully.",
    });

  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
};

// =================================================================
// UPDATED verifyOtpAndSignUp function - This function now handles the user
// existence check and provides a specific response for sign-up vs. sign-in.
// =================================================================
export const verifyOtpAndSignUp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mobile number and OTP are required.",
        });
    }

    const otpRecord = await Otp.findOne({ mobileNumber }).sort({
      createdAt: -1,
    });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired or is invalid." });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "The OTP you entered is incorrect." });
    }

    // --- LOGIC HAS BEEN SHIFTED TO HERE ---
    // 1. Find the user.
    let user = await User.findOne({ mobileNumber });
    let isNewUser = false; // Flag to determine the response message and action.

    // 2. If user doesn't exist, create them and set the flag.
    if (!user) {
      user = await User.create({ mobileNumber });
      isNewUser = true;
    }
    // --- END OF SHIFTED LOGIC ---


    // Generate both tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store the REFRESH token in Redis
    const redis = req.app.get("redis");
    await redis.set(`refreshToken:${user._id}`, refreshToken, { EX: 604800 });

    // Server-side verification that the token was stored (good practice)
    const storedToken = await redis.get(`refreshToken:${user._id}`);
    if (!storedToken) {
      return res.status(500).json({
        success: false,
        message: "Critical Error: Failed to store refresh token in Redis.",
      });
    }

    // Clean up the used OTP
    await Otp.deleteMany({ mobileNumber });

    // 3. Customize the final response message based on whether the user was new.
    const message = isNewUser
      ? 'Signup successful! Welcome.'
      : 'Login successful! Welcome back.';

    res.status(201).json({
      success: true,
      message: message, // Use the new dynamic message
      accessToken,
      refreshToken,
      userId: user._id,
      isNewUser: isNewUser // Send this useful flag to the frontend
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "An internal server error occurred.",
        error: error.message,
      });
  }
};