import { Router } from 'express';
import { MediaController } from '../controllers/media.controller';
import { uploadMedia } from '../middlewares/upload.middleware';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// Upload requires authentication
router.post('/upload', authGuard, uploadMedia.single('file'), MediaController.uploadFile);

// Serving media files supports Range requests (for video/audio streams)
router.get('/:filename', MediaController.getMedia);

export default router;
