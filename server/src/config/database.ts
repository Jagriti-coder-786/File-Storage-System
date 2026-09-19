import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB connected successfully to ${env.MONGODB_URI}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
  });
};
