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

// --- UPDATED: Stricter validation function for exactly 10 digits ---
const validateMobileNumber = (mobile) => {
  // Regex to check if the string contains exactly 10 digits.
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(mobile);
};

export const sendOtp = async (req, res) => {
  try {
    // Only allow countryCode and mobileNumber in the request body
    const { countryCode, mobileNumber } = req.body;
    const allowedFields = ["countryCode", "mobileNumber"];
    const extraFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Only countryCode and mobileNumber are allowed. Extra fields: ${extraFields.join(
          ", "
        )}`,
      });
    }
<<<<<<< HEAD
  const { countryCode, mobileNumber } = req.body;
=======
>>>>>>> 685a6e7df45b7cae1dffdeab3d66a21f25990569
    if (!countryCode || !mobileNumber) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code and mobile number are required.",
        });
    }

    // Only allow country code 91
    // if (countryCode !== "91") {
    //   return res
    //     .status(400)
    //     .json({
    //       success: false,
    //       message: "Only country code 91 is supported.",
    //     });
    // }
    const allowedCodes = User.schema.path('countryCode')?.enumValues || ['91'];
    if (!allowedCodes.includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: "Country code is wrong.",
      });
    }

    // --- UPDATED: Enforce 10-digit rule at the API entry point ---
    // mobileNum = String(mobileNumber);
    if (!validateMobileNumber(String(mobileNumber))) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mobile number must be in digits and exactly 10 digits.",
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
    const smsSent = await sendOtpSms(fullMobileForSms, otp);
    if (!smsSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP." });
    }

    // Store OTP as string to preserve leading zeros
    await Otp.create({ mobileNumber: fullMobileForSms, otp: otp });

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
    // Only allow countryCode, mobileNumber, and otp in the request body
    const allowedFields = ["countryCode", "mobileNumber", "otp"];
    const { countryCode, mobileNumber, otp } = req.body;
    const extraFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Only countryCode, mobileNumber, and otp are allowed. Extra fields: ${extraFields.join(
          ", "
        )}`,
      });
    }
<<<<<<< HEAD
  const { countryCode, mobileNumber, otp } = req.body;
=======
>>>>>>> 685a6e7df45b7cae1dffdeab3d66a21f25990569
    if (!countryCode || !mobileNumber || !otp) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Country code, mobile number, and OTP are required.",
        });
    }

    // Only allow country code 91
    // if (countryCode !== "91") {
    //   return res
    //     .status(400)
    //     .json({
    //       success: false,
    //       message: "Only country code 91 is supported.",
    //     });
    // }
    const allowedCodes = User.schema.path('countryCode')?.enumValues || ['91'];
    if (!allowedCodes.includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: "Country code is wrong.",
      });
    }

    // --- UPDATED: Enforce 10-digit rule at the API entry point ---
    if (!validateMobileNumber(mobileNumber)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mobile number must be exactly 10 digits.",
        });
    }

  const fullMobileForSms = `${countryCode}${mobileNumber}`;
    const otpRecord = await Otp.findOne({
      mobileNumber: fullMobileForSms,
    }).sort({ createdAt: -1 });
    console.log(fullMobileForSms);
    if (!otpRecord) {
      console.log(otpRecord);
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired or is invalid." });
    }

    // Compare OTPs as strings to preserve leading zeros
    if (Number(otp) !== Number(otpRecord.otp)) {
      return res.status(400).json({ success: false, message: "The OTP you entered is incorrect." });
    }

    // Find or Create user using the mobileNumber string.
    let user = await User.findOne({ countryCode, mobileNumber });
    if (!user) {
      user = await User.create({ countryCode, mobileNumber });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user._id); // Short-lived (e.g., 15m-1h)
    const refreshToken = generateRefreshToken(user._id); // Long-lived (e.g., 7d)

    // Store refresh token in Redis for session management
    const redis = req.app.get("redis");
  const tempres=await redis.set(`refreshToken:${user._id}`, refreshToken, { EX: 604800 }); // 7 days
    console.log(tempres);
    // Remove all OTPs for this number after successful verification
    await Otp.deleteMany({ mobileNumber: fullMobileForSms });

    // Return tokens and userId
    res.status(201).json({
      success: true,
      message: "Wlcomeeee!",
      accessToken,
      refreshToken,
      userId: user._id,
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

export const signOut = async (req, res) => {
try {
    const userId = req.user.id; // From authenticate middleware
    const redis = req.app.get("redis");
    const redisKey = `refreshToken:${userId}`;
    const deletedCount = await redis.del(redisKey);
    if (deletedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "Logout successful. Session was already expired or not found."
      });
    }
    return res.status(200).json({
      success: true,
      message: "Logout successful. Refresh token deleted."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed.",
      error: error.message
    });
  }
};