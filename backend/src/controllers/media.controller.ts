import { Request, Response, NextFunction } from 'express';
import { MediaService } from '../services/media.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/error.middleware';

export class MediaController {
  static async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file was uploaded', 400);
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      const mediaData = MediaService.processUploadedFile(req.file, baseUrl);
      return sendSuccess(res, mediaData, 'File uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const filename = req.params.filename;
      const range = req.headers.range;
      MediaService.streamFile(filename, range, res);
    } catch (error) {
      next(error);
    }
  }
}
