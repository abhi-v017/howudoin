import { Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';

export class ConversationController {
  static async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversations = await ConversationService.getUserConversations(req.user!.userId);
      return sendSuccess(res, conversations, 'Conversations retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getOrCreateDirect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await ConversationService.getOrCreateDirectConversation(req.user!.userId, req.body);
      return sendSuccess(res, conversation, 'Direct conversation ready', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const group = await ConversationService.createGroupConversation(req.user!.userId, req.body);
      return sendSuccess(res, group, 'Group created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getConversationDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const details = await ConversationService.getConversationById(req.params.id, req.user!.userId);
      return sendSuccess(res, details, 'Conversation details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const member = await ConversationService.addMemberToGroup(req.params.id, req.user!.userId, req.body);
      return sendSuccess(res, member, 'Member added to group');
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId || req.user!.userId;
      const result = await ConversationService.removeMember(req.params.id, req.user!.userId, targetUserId);
      return sendSuccess(res, result, 'Member removed from group');
    } catch (error) {
      next(error);
    }
  }
}
