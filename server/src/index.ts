import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

// Database Connection
connectDatabase();

// Security & Utility Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', routes);

// Global Centralized Error Handler
app.use(errorHandler);

// Start listening
const server = app.listen(env.PORT, () => {
  console.log(`
  ======================================================
  🚀 CloudVault API Server is running
  📡 Port: http://localhost:${env.PORT}
  🌍 Mode: ${env.NODE_ENV}
  📦 Storage Provider: ${env.STORAGE_PROVIDER.toUpperCase()}
  📁 Local Directory: ${env.LOCAL_STORAGE_DIR}
  ======================================================
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

export default app;
