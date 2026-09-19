import { Router } from 'express';
import authRoutes from './authRoutes';
import folderRoutes from './folderRoutes';
import fileRoutes from './fileRoutes';
import shareRoutes from './shareRoutes';
import storageRoutes from './storageRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/folders', folderRoutes);
router.use('/files', fileRoutes);
router.use('/public/share', shareRoutes);
router.use('/storage', storageRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CloudVault API',
  });
});

export default router;
