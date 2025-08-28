// controllers/authController.js
import otpGenerator from "otp-generator";
import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";
import { sendOtpSms } from "../services/smsService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";
import { generatePrefixedApiKey, validateApiKey } from "../utils/apiKeyUtils.js";

// --- UPDATED: Stricter validation function for exactly 10 digits ---
const validateMobileNumber = (mobile) => {
  // Regex to check if the string contains exactly 10 digits and doesn't start with 0
  const mobileRegex = /^[1-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

export const sendOtp = async (req, res) => {
  try {
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Only allow countryCode and mobileNumber in the request body
    const allowedFields = ["countryCode", "mobileNumber"];
    const extraFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Only countryCode and phone number are allowed",
      });
    }
    const { countryCode, mobileNumber } = req.body;
    if (!countryCode || !mobileNumber) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code and mobile number are required.",
        });
    }

    // --- STRICT: Country code must be exactly "91" ---
    if (String(countryCode).trim() !== "91") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code must be exactly '91'. No other country codes are supported.",
        });
    }

    // --- UPDATED: Enforce 10-digit rule at the API entry point ---
    if (!validateMobileNumber(mobileNumber)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mobile number must be exactly 10 digits and cannot start with 0.",
        });
    }

    const fullMobileForSms = `${countryCode}${mobileNumber}`;
    // Generate a 6-digit numeric OTP (no alphabets, no special chars, only digits)
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    
    // Debug: Log OTP generation
    console.log(`🔢 Generated OTP for ${fullMobileForSms}: ${otp}`);
    
    const smsSent = await sendOtpSms(fullMobileForSms, otp);
    if (!smsSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP." });
    }

    // Store OTP as string to preserve leading zeros
    console.log(`💾 Storing OTP for: ${fullMobileForSms}`);
    await Otp.create({ mobileNumber: fullMobileForSms, otp: otp });

    // Clean up old OTP records for this number (including any wrong format)
    await Otp.deleteMany({ 
      mobileNumber: { $in: [fullMobileForSms, `+${fullMobileForSms}`] },
      _id: { $ne: (await Otp.findOne({ mobileNumber: fullMobileForSms }).sort({ createdAt: -1 }))?._id }
    });

    // The query now uses the mobileNumber string directly.
    const user = await User.findOne({ countryCode, mobileNumber });

    res.status(200).json({
      success: true,
      message: user
        ? "Welcome back! OTP sent for login."
        : "OTP sent for new account verification.",
      userExists: !!user,
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

export const verifyOtpAndSignUp = async (req, res) => {
  try {
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Only allow countryCode, mobileNumber, and otp in the request body
    const allowedFields = ["countryCode", "mobileNumber", "otp"];
    const extraFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Only countryCode and phone number are allowed",
      });
    }
    const { countryCode, mobileNumber, otp } = req.body;
    if (!countryCode || !mobileNumber || !otp) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code, mobile number, and OTP are required.",
        });
    }

    // --- STRICT: Country code must be exactly "91" ---
    if (String(countryCode).trim() !== "91") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code must be exactly '91'. No other country codes are supported.",
        });
    }

    // --- UPDATED: Enforce 10-digit rule at the API entry point ---
    if (!validateMobileNumber(mobileNumber)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mobile number must be exactly 10 digits and cannot start with 0.",
        });
    }

    const fullMobileForSms = `${countryCode}${mobileNumber}`;
    console.log(`🔍 Looking for OTP with: ${fullMobileForSms}`);
    
    const otpRecord = await Otp.findOne({
      mobileNumber: fullMobileForSms,
    }).sort({ createdAt: -1 });
    
    // Debug: Show all recent OTPs
    const allOtps = await Otp.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`📋 All recent OTPs:`, allOtps.map(otp => ({ mobile: otp.mobileNumber, otp: otp.otp, time: otp.createdAt })));
    
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired or is invalid." });
    }

    // Compare OTPs as strings to preserve leading zeros
    console.log(`🔍 Comparing OTPs:`);
    console.log(`📝 Entered: "${otp}" (${typeof otp})`);
    console.log(`💾 Stored: "${otpRecord.otp}" (${typeof otpRecord.otp})`);
    console.log(`📱 Record mobile: "${otpRecord.mobileNumber}"`);
    console.log(`📱 Search mobile: "${fullMobileForSms}"`);
    
    if (String(otp).trim() !== String(otpRecord.otp).trim()) {
      console.log(`❌ OTP Mismatch!`);
      return res.status(400).json({ success: false, message: "The OTP you entered is incorrect." });
    }
    
    console.log(`✅ OTP Match Success!`);

    // Find or Create user using the mobileNumber string.
    let user = await User.findOne({ countryCode, mobileNumber });
    if (!user) {
      user = await User.create({ countryCode, mobileNumber });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user._id); // Short-lived (e.g., 15m-1h)
    const refreshToken = generateRefreshToken(user._id); // Long-lived (e.g., 7d)
    
    // Generate UUID API Key for secure token exchange
    const uuidApiKey = generatePrefixedApiKey();

    // Store tokens and API key in Redis
    const redis = req.app.get("redis");
    
    // Store refresh token (for session management)
    await redis.set(`refreshToken:${user._id}`, refreshToken, { EX: 604800 }); // 7 days
    
    // Store UUID API Key mapped to JWT tokens
    await redis.set(`apikey:${uuidApiKey}`, JSON.stringify({
      accessToken,
      refreshToken,
      userId: user._id.toString(),
      createdAt: new Date().toISOString()
    }), { EX: 250 }); // 15 minutes expiry for API key

    // Remove all OTPs for this number after successful verification
    await Otp.deleteMany({ mobileNumber: fullMobileForSms });

    // Return only UUID API Key (NOT the actual JWT tokens)
    res.status(201).json({
      success: true,
      message: "Authentication successful! Use the API key to get your access token.",
      uuidApiKey,
      userId: user._id,
      expiresIn: 900 // API key expires in 15 minutes
    });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Bad Request!.",
        error: error.message,
      });
  }
};

export const exchangeApiKeyForTokens = async (req, res) => {
  try {
    const { uuidApiKey } = req.body;
    
    if (!uuidApiKey) {
      return res.status(400).json({
        success: false,
        message: "UUID API key is required."
      });
    }

    // Validate API key format
    if (!validateApiKey(uuidApiKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid API key format."
      });
    }

    // Get tokens from Redis using API key
    const redis = req.app.get("redis");
    const tokenData = await redis.get(`apikey:${uuidApiKey}`);
    
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired API key. Please login again."
      });
    }

    // Parse stored token data
    const { accessToken, refreshToken, userId } = JSON.parse(tokenData);
    
    // Delete the API key after use (one-time use)
    await redis.del(`apikey:${uuidApiKey}`);
    
    // Return the actual JWT tokens
    res.status(200).json({
      success: true,
      message: "Token exchange successful!",
      accessToken,
      refreshToken,
      userId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token exchange failed.",
      error: error.message
    });
  }
};

export const signOut = async (req, res) => {
  try {
    // Validate that user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for sign out.",
      });
    }

    const userId = req.user.id; // From the authenticate middleware

    // Get Redis instance
    const redis = req.app.get("redis");
    
    if (!redis) {
      return res.status(500).json({
        success: false,
        message: "Redis connection not available.",
      });
    }
    
    // Remove the refresh token from Redis to invalidate the session
    const redisKey = `refreshToken:${userId}`;
    const deletedCount = await redis.del(redisKey);
    
    console.log(`🔐 Sign out attempt for user ${userId}: Redis key ${redisKey}, deleted count: ${deletedCount}`);
    
    if (deletedCount === 0) {
      // Session was already expired or invalid
      return res.status(200).json({
        success: true,
        message: "Sign out successful. Session was already expired.",
      });
    }

    // Successful signout
    res.status(200).json({
      success: true,
      message: "Sign out successful. Session terminated securely.",
    });
  } catch (error) {
    console.error(`❌ Sign out error for user ${req.user?.id}:`, error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred during sign out.",
      error: error.message,
    });
  }
};
