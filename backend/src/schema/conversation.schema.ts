import { z } from 'zod';

export const createDirectConversationSchema = z.object({
  recipientId: z.string().min(1, 'Invalid recipient identifier').optional(),
  recipientUsername: z.string().optional(),
  recipientTag: z.string().length(4).optional(),
}).refine(
  (data) => data.recipientId || (data.recipientUsername && data.recipientTag),
  { message: 'Provide either recipientId or recipientUsername with recipientTag' }
);

export const createGroupConversationSchema = z.object({
  title: z.string().min(2, 'Group title must be at least 2 characters').max(100),
  description: z.string().max(255).optional(),
  avatarUrl: z.string().url().optional(),
  memberIds: z.array(z.string().min(1)).optional().default([]),
});

export const addGroupMemberSchema = z.object({
  memberId: z.string().min(1, 'Invalid user ID').optional(),
  username: z.string().optional(),
  tag: z.string().length(4).optional(),
}).refine(
  (data) => data.memberId || (data.username && data.tag),
  { message: 'Provide either memberId or username with tag' }
);

export const updateGroupSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(255).optional(),
  avatarUrl: z.string().url().optional(),
});
