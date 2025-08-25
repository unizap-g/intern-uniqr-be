// server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
// import userRoute from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import setupSwagger from './swagger.js';

const app = express();
app.use(cors());
app.use(express.json());

const startServer = async () => {
  try {
    const redisClient = createClient({
      password: process.env.REDIS_PASSWORD,
      socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
    });
    redisClient.on('error', err => console.error('❌ Redis Client Error:', err));
    await redisClient.connect();
    console.log('✅ Redis Connected Successfully.');
    app.set('redis', redisClient);

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas Connected Successfully.');

    app.use('/api/auth', authRoutes);
    // app.use('/api/user', userRoute);

        // Health checker API
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', message: 'Server is healthy' });
    });
    // Swagger docs
    setupSwagger(app);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};




startServer();