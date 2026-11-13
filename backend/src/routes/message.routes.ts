import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { sendMessageSchema, editMessageSchema } from '../schema/message.schema';

const router = Router();

router.use(authGuard);

router.post('/', validate(sendMessageSchema), MessageController.sendMessage);
router.get('/:conversationId', MessageController.getMessages);
router.post('/:conversationId/read', MessageController.markAsRead);
router.patch('/:messageId', validate(editMessageSchema), MessageController.editMessage);
router.delete('/:messageId', MessageController.deleteMessage);

export default router;
