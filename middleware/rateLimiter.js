import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

// Accept redisClient as a parameter and create a unique RedisStore for each limiter
export function createRateLimiters(redisClient) {
  // OTP Rate Limiter: limit per mobile number, not per IP
  const otpRateLimiter = rateLimit({
    keyGenerator: (req, res) => {
      // Use mobileNumber from body if present, else fallback to ipKeyGenerator for proper IPv6 handling
      if (req.body && req.body.mobileNumber) {
        return String(req.body.mobileNumber);
      }
      return ipKeyGenerator(req, res);
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:otp:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 200, // Lowered for security: 3 OTPs per 15 min per number
    message: (req, res) => {
      const number = req.body && req.body.mobileNumber ? req.body.mobileNumber : 'this number';
      return { success: false, message: `The mobile number ${number} has exceeded the OTP request limit. Please try again after 15 minutes.` };
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  const generalRateLimiter = rateLimit({
    keyGenerator: ipKeyGenerator, // Use recommended helper for IPv6 safety
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:general:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
  });

  return { otpRateLimiter, generalRateLimiter };
}