import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateJwt, getMe);
router.patch('/profile', authenticateJwt, updateProfile);
router.post('/change-password', authenticateJwt, changePassword);

export default router;
