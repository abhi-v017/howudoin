import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../schema/user.schema';

const router = Router();

router.use(authGuard);

router.get('/search', UserController.searchUsers);
router.get('/:userId', UserController.getUserProfile);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);

export default router;
