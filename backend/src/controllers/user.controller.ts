import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess } from '../utils/response';

export class UserController {
  static async searchUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.query as string) || '';
      const users = await UserService.searchUsers(query, req.user!.userId);
      return sendSuccess(res, users, 'Users retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.userId);
      return sendSuccess(res, user, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await UserService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
