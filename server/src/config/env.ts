import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Attempt to load .env from root, server directory, or process working directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('5000').transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cloudvault'),
  JWT_SECRET: z.string().default('super_secret_cloudvault_jwt_key_development_only_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DEFAULT_STORAGE_QUOTA: z.union([z.string(), z.number()]).default('1073741824').transform((v) => (typeof v === 'number' ? v : parseInt(v, 10))), // 1 GB in bytes
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional().default('471494995399617'),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional().default('cloudvault-bucket'),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_S3_FORCE_PATH_STYLE: z.union([z.string(), z.boolean()]).optional().default('false').transform((v) => v === true || v === 'true'),
});

let parsedEnv: z.infer<typeof envSchema>;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:', JSON.stringify(error.format(), null, 2));
  } else {
    console.error('❌ Error parsing environment variables:', error);
  }
  process.exit(1);
}

export const env = parsedEnv;

