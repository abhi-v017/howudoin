import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { AppError } from './error.middleware';

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  },
});

const allowedMimePrefixes = [
  'image/',
  'audio/',
  'video/',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isAllowed = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix) || file.mimetype === prefix);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new AppError(`Unsupported file format (${file.mimetype}). Only images, audio, video, PDF, text, and zip files are permitted.`, 400));
  }
};

export const uploadMedia = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024, // in bytes
  },
  fileFilter,
});
