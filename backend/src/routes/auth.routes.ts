import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateBody } from '../middlewares/validate';
import { authLimiter } from '../middlewares/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', authLimiter, validateBody(loginSchema), (req, res) => authController.login(req, res));
router.post('/refresh-token', validateBody(refreshTokenSchema), (req, res) => authController.refreshToken(req, res));
router.get('/me', authenticate, (req, res) => authController.getProfile(req, res));
router.post('/change-password', authenticate, validateBody(changePasswordSchema), (req, res) => authController.changePassword(req, res));

export default router;

