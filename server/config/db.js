import mongoose from 'mongoose';

let cachedConnection = global.mongooseConnection || null;
let mongod = null;

export const connectDB = async () => {
  // If connection is already open/active (crucial for Vercel serverless reuse)
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }

  try {
    const uri = process.env.MONGODB_URI;

    // 1. If a custom URI is provided (e.g., Atlas remote cluster)
    if (uri && !uri.includes('127.0.0.1') && !uri.includes('localhost')) {
      console.log('Connecting to MongoDB via URI...');
      cachedConnection = await mongoose.connect(uri, {
        bufferCommands: false,
      });
      global.mongooseConnection = cachedConnection;
      console.log('MongoDB connected successfully to remote cluster.');
      return cachedConnection;
    }

    // 2. Attempt direct local connection if URI is local
    try {
      if (uri) {
        cachedConnection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        global.mongooseConnection = cachedConnection;
        console.log('MongoDB connected successfully to local instance.');
        return cachedConnection;
      }
    } catch (localErr) {
      console.log('Local MongoDB not reachable, starting embedded in-memory MongoDB for zero-config development...');
    }

    // 3. Fallback to MongoMemoryServer for instant zero-setup local development
    if (!mongod) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'uniform_measurement_db'
        }
      });
    }
    const memoryUri = mongod.getUri();
    cachedConnection = await mongoose.connect(memoryUri);
    global.mongooseConnection = cachedConnection;
    console.log(`Connected to Embedded MongoDB Memory Server at ${memoryUri}`);
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
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
  } catch (error) {
    console.error('Error disconnecting from database:', error.message);
  }
};
