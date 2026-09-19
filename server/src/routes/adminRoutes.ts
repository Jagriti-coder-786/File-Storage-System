import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  getAdminFiles,
  adminDeleteFile,
} from '../controllers/adminController';
import { authenticateJwt, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id', updateAdminUser);
router.get('/files', getAdminFiles);
router.delete('/files/:id', adminDeleteFile);

export default router;
