// server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import { createAuthRoutes } from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';
import setupSwagger from './swagger.js';
import { createRateLimiters } from './middleware/rateLimiter.js';

const app = express();
app.use(cors("https://intern-uniqr-fe.onrender.com/"));
app.use(express.json());

const startServer = async () => {
  try {
    // UPDATED to use the cleaner URI format
    const redisClient = createClient({
      url: process.env.REDIS_URL
    });
    redisClient.on('error', err => console.error('❌ Redis Client Error:', err));
    await redisClient.connect();
    console.log('✅ Redis Connected Successfully.');
    app.set('redis', redisClient);

    
    // Create rate limiters with the connected redisClient
    const { otpRateLimiter, generalRateLimiter } = createRateLimiters(redisClient);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas Connected Successfully.');

    // --- SETUP SWAGGER AND HEALTH CHECK ---
    setupSwagger(app);

    // UPGRADED Health checker API (not rate-limited)
    app.get('/api/health', async (req, res) => {
      const healthcheck = { status: 'OK', timestamp: new Date(), services: { mongodb: 'Disconnected', redis: 'Disconnected' }};
      try {
        if (mongoose.connection.readyState === 1) healthcheck.services.mongodb = 'Connected';
        if (redisClient.isOpen) {
          await redisClient.ping();
          healthcheck.services.redis = 'Connected';
        }
        if (healthcheck.services.mongodb !== 'Connected' || healthcheck.services.redis !== 'Connected') {
          healthcheck.status = 'SERVICE_UNAVAILABLE';
          return res.status(503).json(healthcheck);
        }
        res.status(200).json(healthcheck);
      } catch (error) {
        healthcheck.status = 'SERVICE_UNAVAILABLE';
        res.status(503).json({ ...healthcheck, error: error.message });
      }
    });

    // --- APPLY MIDDLEWARE AND ROUTES ---

    // Only apply OTP rate limiter to /api/auth endpoints (number-based)
    app.use('/api/auth', createAuthRoutes(otpRateLimiter));

    // User routes (all authenticated user endpoints)
    app.use('/api/user', userRoutes);

    const PORT = process.env.PORT || 3000;
    // UPDATED to listen on all network interfaces
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 API Docs available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);

    process.exit(1);
  }
};

startServer();