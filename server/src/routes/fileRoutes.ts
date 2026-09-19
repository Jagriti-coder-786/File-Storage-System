import { Router } from 'express';
import {
  uploadFiles,
  getFiles,
  getFileById,
  downloadFile,
  serveRawFile,
  renameFile,
  moveFile,
  toggleStar,
  deleteFile,
  restoreFile,
  permanentDeleteFile,
  shareFile,
  revokeShare,
} from '../controllers/fileController';
import { authenticateJwt } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// Public / Semi-public raw streaming for preview / authenticated files
router.get('/raw/:key', serveRawFile);

// Authenticated routes
router.use(authenticateJwt);

router.post('/upload', uploadMiddleware.array('files', 10), uploadFiles);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.get('/:id/download', downloadFile);
router.patch('/:id/rename', renameFile);
router.patch('/:id/move', moveFile);
router.post('/:id/star', toggleStar);
router.delete('/:id', deleteFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id/permanent', permanentDeleteFile);
router.post('/:id/share', shareFile);
router.delete('/:id/share', revokeShare);

export default router;
