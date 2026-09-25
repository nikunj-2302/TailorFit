import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedDatabase } from './seed/seed.js';
import User from './models/User.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import personRoutes from './routes/personRoutes.js';
import garmentTypeRoutes from './routes/garmentTypeRoutes.js';
import measurementFieldRoutes from './routes/measurementFieldRoutes.js';
import measurementTemplateRoutes from './routes/measurementTemplateRoutes.js';
import measurementRoutes from './routes/measurementRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
dotenv.config({ path: '../.env' });

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Clothing Measurement & Uniform Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// Seed endpoint for convenience in demo/dev mode
app.post('/api/seed', async (req, res, next) => {
  try {
    await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Database seeded successfully with demo data.',
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/garments', garmentTypeRoutes);
app.use('/api/measurement-fields', measurementFieldRoutes);
app.use('/api/measurement-templates', measurementTemplateRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start standalone server only when not running inside Vercel serverless environment
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();

      // Auto-seed if database is brand new and empty
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('No users found in database. Auto-seeding initial demo data...');
        await seedDatabase();
      }

      app.listen(PORT, () => {
        console.log(`🚀 Uniform Management Server running on port ${PORT}`);
        console.log(`API Health: http://localhost:${PORT}/api/health`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
    }
  };

  startServer();
}

export default app;
