import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens')
    .trim()
    .optional(),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').max(500).optional(),
  theme: z.string().max(30).optional(),
});

export const searchUserQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});
