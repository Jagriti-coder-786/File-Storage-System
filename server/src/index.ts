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

// Prepare CORS origin parser
const customOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = [
  ...customOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, Postman)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list or vercel/render preview domains
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com');

      if (isAllowed) {
        return callback(null, true);
      }

      // In production or development, allow by default if configured or permit origin
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health check endpoint for Render service monitoring
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CloudVault API Server',
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'CloudVault API Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      files: '/api/files',
      folders: '/api/folders',
    },
  });
});

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
