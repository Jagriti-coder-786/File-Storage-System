import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected successfully`);
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message || error);
    console.error('💡 Tip: Ensure your MongoDB Atlas Network Access includes 0.0.0.0/0 (Allow Access from Anywhere).');
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
  });
};
