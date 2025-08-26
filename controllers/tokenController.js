import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
    // Check Redis for session validity
    const redis = req.app.get('redis');
    const redisKey = `refreshToken:${payload.id}`;
    const storedRefreshToken = await redis.get(redisKey);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid. Please login again.' });
    }
    // Check if user still exists before issuing new access token
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    // Issue new access token
    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not refresh access token.', error: error.message });
  }
};
