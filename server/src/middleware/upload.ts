import multer from 'multer';

// Use memory storage so Multer yields buffer which we stream to IStorageProvider
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file limit
    files: 10, // Max 10 files per batch
  },
});
