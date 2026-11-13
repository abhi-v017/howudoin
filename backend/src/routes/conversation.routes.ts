import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createDirectConversationSchema,
  createGroupConversationSchema,
  addGroupMemberSchema,
} from '../schema/conversation.schema';

const router = Router();

router.use(authGuard);

router.get('/', ConversationController.getConversations);
router.post('/direct', validate(createDirectConversationSchema), ConversationController.getOrCreateDirect);
router.post('/group', validate(createGroupConversationSchema), ConversationController.createGroup);
router.get('/:id', ConversationController.getConversationDetails);
router.post('/:id/members', validate(addGroupMemberSchema), ConversationController.addMember);
router.delete('/:id/members/:userId', ConversationController.removeMember);
router.delete('/:id/leave', ConversationController.removeMember);

export default router;
