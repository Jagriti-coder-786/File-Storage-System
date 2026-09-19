import { Router } from 'express';
import { getStorageSummary, getRecentActivities } from '../controllers/storageController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.get('/summary', getStorageSummary);
router.get('/activities', getRecentActivities);

export default router;
