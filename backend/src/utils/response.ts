import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, message: string = 'An error occurred', statusCode: number = 500, error: any = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error ? { error } : {}),
  });
}
