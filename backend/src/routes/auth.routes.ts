import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, googleAuthSchema } from '../schema/auth.schema';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// Rate limiter to prevent bot spam & account creation abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please wait 15 minutes and try again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 account registrations per window
  message: {
    success: false,
    message: 'Registration rate limit reached. Please wait a few minutes before creating another account.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
router.post('/register', registerLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/google', authLimiter, validate(googleAuthSchema), AuthController.googleLogin);
router.get('/me', authGuard, AuthController.getMe);

export default router;
