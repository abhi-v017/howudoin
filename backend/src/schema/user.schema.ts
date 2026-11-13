import { z } from 'zod';

export const updateProfileSchema = z.object({
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  avatarUrl: z.string().url().optional(),
  theme: z.enum(['dark', 'light', 'cyberpunk', 'midnight', 'emerald']).optional(),
});

export const searchUserQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});
