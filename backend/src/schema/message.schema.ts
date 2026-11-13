import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().max(5000, 'Message cannot exceed 5000 characters').optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'SYSTEM']).default('TEXT'),
  mediaUrl: z.string().optional(),
  mediaName: z.string().optional(),
  mediaSize: z.number().int().optional(),
  mediaMimeType: z.string().optional(),
  replyToId: z.string().uuid().optional(),
}).refine((data) => data.content || data.mediaUrl, {
  message: 'Message must have either text content or a media file',
});

export const getMessagesQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});
