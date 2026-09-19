import { Router } from 'express';
import { getSharedFile, downloadSharedFile } from '../controllers/shareController';

const router = Router();

// Completely public endpoints for shared files
router.get('/:token', getSharedFile);
router.get('/:token/download', downloadSharedFile);

export default router;
