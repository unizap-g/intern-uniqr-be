import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate user using JWT access token.
 * Checks token validity and existence in Redis (for revocation/blacklist support).
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get Authorization header with multiple fallbacks
    const authHeader = req.headers.authorization || 
                      req.headers.Authorization ||
                      req.get('Authorization') ||
                      req.get('authorization');
    
    console.log('� Auth attempt - Header present:', !!authHeader);
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Invalid token format. Must be Bearer token.' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    
    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      console.log('❌ JWT verification failed:', err.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired access token.' });
    }
    
    // Check if user session exists in Redis
    const redis = req.app.get('redis');
    if (!redis) {
      return res.status(500).json({ success: false, message: 'Session service unavailable.' });
    }
    
    const sessionKey = `refreshToken:${payload.id}`;
    const sessionExists = await redis.exists(sessionKey);
    
    if (!sessionExists) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    
    req.user = { id: payload.id };
    console.log('✅ Auth success for user:', payload.id);
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed.', error: error.message });
  }
};
