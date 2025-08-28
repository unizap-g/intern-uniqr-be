import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { generateAccessToken } from '../utils/tokenUtils.js';

export const refreshAccessToken = async (req, res) => {
  try {
    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }
    
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,{ignoreExpiration:true});
      console.log("hello",payload);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh.',error: err.message });
    }
    
    // Check Redis for session validity
    const redis = req.app.get('redis');
    const redisKey = `refreshToken:${payload.id}`;
    const storedRefreshToken = await redis.get(redisKey);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return res.status(402).json({ success: false, message: 'Session expired or invalid. Please login again.' });
    }
    
    // Check if user still exists before issuing new access token
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Issue new access token using utility function
    const accessToken = generateAccessToken(user._id);
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not refresh access token.', error: error.message });
  }
};
