// server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import { createAuthRoutes } from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import setupSwagger from './swagger.js';
import { createRateLimiters } from './middleware/rateLimiter.js';
import qrRoutes from './routes/qrRoutes.js';


const app = express();

// Fixed CORS configuration
// app.use(cors({ 
//   origin: function (origin, callback) {
//     // Allow requests with no origin (mobile apps, curl, Postman)
//     if (!origin) return callback(null, true);
    
//     // Allow all localhost origins and production frontend
//     const allowedOrigins = [
//       'http://localhost:3000',
//       'http://localhost:3001', 
//       'http://localhost:5173',
//       'http://127.0.0.1:3000',
//       'https://intern-uniqr-fe.onrender.com',
//       process.env.CORS_URL
//     ].filter(Boolean);
    
//     // Allow any localhost in development
//     if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
//       return callback(null, true);
//     }
    
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
    
//     // For debugging - allow all origins temporarily
//     console.log('🌐 CORS request from:', origin);
//     callback(null, true);
//   },
//   credentials: true,
//   allowedHeaders: [
//     'Origin',
//     'X-Requested-With', 
//     'Content-Type',
//     'Accept',
//     'Authorization',
//     'Cache-Control',
//     'Pragma'
//   ],
//   exposedHeaders: ['Authorization'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   optionsSuccessStatus: 200
// }));
app.use(cors(
  {
    origin: "*"
  }
));
app.use(express.json({ 
  verify: (req, res, buf, encoding) => {
    // Handle empty body for POST requests
    if (buf.length === 0 && req.method === 'POST') {
      req.rawBody = '{}';
    }
  }
}));

// Add JSON parsing error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format. Please check your request body syntax.'
    });
  }
  next(error);
});

    // QR Code routes (authenticated endpoints)
    app.use('/api/qr', qrRoutes);


const startServer = async () => {

  try {
    // Connect to Redis
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

    // Setup Swagger documentation
    setupSwagger(app);

    // Health check endpoint
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

    // Apply middleware and routes
    app.use('/api/auth', createAuthRoutes(otpRateLimiter, generalRateLimiter));
    app.use('/api/user', generalRateLimiter, userRoutes);

    // 404 handler for undefined routes - Always return JSON
    app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });

    // Global error handler - Always return JSON
  app.use((error, req, res, next) => {
      console.error('Global Error Handler:', error);
      
      // Ensure we always send JSON response
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });


    const PORT = process.env.PORT || 3000;
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