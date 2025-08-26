import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate user using JWT access token.
 * Checks token validity and existence in Redis (for revocation/blacklist support).
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    // Verify JWT
    let payload;
    console.log(token, process.env.ACCESS_TOKEN_SECRET);
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      console.log(err.message); 
      return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
    }
    // Check Redis for token revocation (optional, for logout/blacklist support)
    const redis = req.app.get('redis');
    const redisKey = `refreshToken:${payload.id}`;
    const storedRefreshToken = await redis.get(redisKey);
    if (!storedRefreshToken) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    req.user = { id: payload.id };
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authentication failed.', error: error.message });
  }
};
