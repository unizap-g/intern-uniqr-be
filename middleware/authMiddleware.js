import jwt from "jsonwebtoken";
// import { generatePrefixedApiKey, generateRefreshToken, validateApiKey } from "../utils/auth.js";
import { generatePrefixedApiKey,validateApiKey } from "../utils/apiKeyUtils.js";
import { generateRefreshToken } from "../utils/tokenUtils.js";

export const authenticate = async (req, res, next) => {
  const uuidApiKey = req.headers["x-api-key"];
  const uId = req.headers["x-user-id"];

  try {

    if (!uuidApiKey || !uId) {
      return res.status(400).json({
        success: false,
        message: "API key and User ID are required.",
      });
    }


    if (!validateApiKey(uuidApiKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid API key format.",
      });
    }


    const redis = req.app.get("redis");


    const tokenData = await redis.get(`refreshToken:${uuidApiKey}`);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login again.",
      });
    }

    try {

      const decoded = jwt.verify(tokenData, process.env.REFRESH_TOKEN_SECRET);


      req.user = { uId: uId, apiKey: uuidApiKey, decoded };

      return next(); 

    } catch (error) {
      if (error.name === "TokenExpiredError") {

        const newUuidApiKey = generatePrefixedApiKey();
        const newRefreshToken = generateRefreshToken(uId);

        await redis.multi()
          .del(`refreshToken:${uuidApiKey}`)
          .set(`refreshToken:${newUuidApiKey}`, newRefreshToken, { EX: 7 * 24 * 60 * 60 })
          .exec();

        req.user = { uId: uId, apiKey: newUuidApiKey };


        res.setHeader("x-api-key", newUuidApiKey);

        return next();
      }

      return res.status(401).json({
        success: false,
        message: "Unauthorized. Invalid refresh token.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
      error: error.message,
    });
  }
};
