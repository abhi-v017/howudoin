import { Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';

export class MessageController {
  static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const message = await MessageService.sendMessage(req.user!.userId, req.body);
      return sendSuccess(res, message, 'Message sent successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.conversationId;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const result = await MessageService.getMessages(conversationId, req.user!.userId, { cursor, limit });
      return sendSuccess(res, result, 'Messages retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.markConversationAsRead(req.params.conversationId, req.user!.userId);
      return sendSuccess(res, result, 'Messages marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async editMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await MessageService.editMessage(req.params.messageId, req.user!.userId, req.body.content);
      return sendSuccess(res, updated, 'Message edited successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await MessageService.deleteMessage(req.params.messageId, req.user!.userId);
      return sendSuccess(res, deleted, 'Message deleted');
    } catch (error) {
      next(error);
    }
  }
}
