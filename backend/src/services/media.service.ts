import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { config } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

export class MediaService {
  /**
   * Determine MessageType based on MIME type
   */
  static getMessageType(mimeType: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  }

  /**
   * Process uploaded file and return media metadata
   */
  static processUploadedFile(file: Express.Multer.File, baseUrl: string) {
    const type = this.getMessageType(file.mimetype);
    const mediaUrl = `${baseUrl}/api/v1/media/${file.filename}`;

    return {
      filename: file.filename,
      originalName: file.originalname,
      mediaUrl,
      size: file.size,
      mimeType: file.mimetype,
      type,
    };
  }

  /**
   * Safely stream file with HTTP Range support for media players
   */
  static streamFile(filename: string, rangeHeader: string | undefined, res: Response) {
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(config.uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Requested media file not found', 404);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/m4a',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // Handle HTTP Range requests for video/audio seeking
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // 1 day client cache
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }
}
