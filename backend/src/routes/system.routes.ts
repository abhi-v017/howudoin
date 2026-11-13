import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';

const router = Router();

router.get('/ping', SystemController.ping);
router.get('/health', SystemController.getHealth);
router.get('/stats', SystemController.getStats);

export default router;
