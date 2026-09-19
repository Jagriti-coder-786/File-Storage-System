import { Router } from 'express';
import {
  createFolder,
  getFolders,
  getFolderById,
  renameFolder,
  moveFolder,
  deleteFolder,
} from '../controllers/folderController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

router.use(authenticateJwt);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id', getFolderById);
router.patch('/:id/rename', renameFolder);
router.patch('/:id/move', moveFolder);
router.delete('/:id', deleteFolder);

export default router;
