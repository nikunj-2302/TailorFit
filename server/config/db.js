import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless invocations in production (e.g. Vercel).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let mongod = null;

export const connectDB = async () => {
  // If connection is already open/active (crucial for Vercel serverless reuse)
  if (cached.conn && mongoose.connection.readyState >= 1) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    };

    // 1. If a custom URI is provided (e.g., Atlas remote cluster)
    if (uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
      console.log('Connecting to MongoDB Atlas remote cluster...');
      cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
        console.log('MongoDB connected successfully to remote cluster.');
        return mongooseInstance;
      });
    } else if (uri) {
      // 2. Local MongoDB URI
      console.log('Connecting to local MongoDB instance...');
      cached.promise = mongoose.connect(uri, { ...opts, serverSelectionTimeoutMS: 2000 })
        .then((m) => {
          console.log('MongoDB connected successfully to local instance.');
          return m;
        })
        .catch(async () => {
          console.log('Local MongoDB not reachable, starting embedded in-memory MongoDB...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          if (!mongod) {
            mongod = await MongoMemoryServer.create({
              instance: { dbName: 'uniform_measurement_db' },
            });
          }
          return mongoose.connect(mongod.getUri(), opts);
        });
    } else {
      // 3. No URI provided
      if (process.env.VERCEL) {
        throw new Error('MONGODB_URI environment variable is missing on Vercel. Please set MONGODB_URI in your Vercel Project Settings.');
      }
      console.log('No MONGODB_URI provided, starting embedded in-memory MongoDB for local development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      if (!mongod) {
        mongod = await MongoMemoryServer.create({
          instance: { dbName: 'uniform_measurement_db' },
        });
      }
      cached.promise = mongoose.connect(mongod.getUri(), opts);
    }
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    if (error.name === 'MongooseServerSelectionError' || error.message?.includes('whitelist') || error.message?.includes('SSL')) {
      console.error('\n⚠️  [MongoDB Atlas Connection Error] IP not whitelisted.');
      console.error('👉 Ensure 0.0.0.0/0 (Allow Access from Anywhere) is added to your MongoDB Atlas Network Access list for Vercel deployments.\n');
    }
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    cached.conn = null;
    cached.promise = null;
  } catch (error) {
    console.error('Error disconnecting from database:', error.message);
  }
};

