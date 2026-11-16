import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { generateTag } from '../utils/tagGenerator';
import { signToken } from '../utils/jwt';

export class UserService {
  /**
   * Search users by Unique ID (e.g. "abekrox_1971"), username, or username#tag
   */
  static async searchUsers(query: string, currentUserId: string) {
    const rawQuery = query.trim();
    let usernameQuery = rawQuery;
    let tagQuery: string | undefined;

    if (usernameQuery.includes('#')) {
      const parts = usernameQuery.split('#');
      usernameQuery = parts[0];
      tagQuery = parts[1];
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } }, // exclude self
          tagQuery
            ? {
                username: { equals: usernameQuery, mode: 'insensitive' },
                tag: { equals: tagQuery },
              }
            : {
                OR: [
                  { id: { contains: rawQuery.toLowerCase() } },
                  { username: { contains: usernameQuery, mode: 'insensitive' } },
                ],
              },
        ],
      },
      select: {
        id: true,
        username: true,
        tag: true,
        avatarUrl: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20,
    });

    return users.map((u) => ({
      ...u,
      displayName: u.username,
      uniqueId: u.id,
    }));
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        tag: true,
        avatarUrl: true,
        bio: true,
        theme: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      ...user,
      displayName: user.username,
      uniqueId: user.id,
    };
  }

  /**
   * Update current user profile (username, bio, theme, avatarUrl)
   */
  static async updateProfile(
    userId: string,
    data: { username?: string; bio?: string; avatarUrl?: string; theme?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let newUsername = user.username;
    let newTag = user.tag;

    if (data.username && data.username.trim() !== user.username) {
      newUsername = data.username.trim();

      // Check if (newUsername, current tag) is taken by another user
      const existingWithSameTag = await prisma.user.findFirst({
        where: {
          username: { equals: newUsername, mode: 'insensitive' },
          tag: user.tag,
          id: { not: userId },
        },
      });

      if (existingWithSameTag) {
        // Tag collision: generate a fresh unique tag for this username
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          const candidateTag = generateTag();
          const existing = await prisma.user.findFirst({
            where: {
              username: { equals: newUsername, mode: 'insensitive' },
              tag: candidateTag,
              id: { not: userId },
            },
          });
          if (!existing) {
            newTag = candidateTag;
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          throw new AppError('This username is currently congested. Please pick another name.', 409);
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username: newUsername,
        tag: newTag,
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
      },
      select: {
        id: true,
        username: true,
        tag: true,
        avatarUrl: true,
        bio: true,
        theme: true,
        email: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: updated.id,
      username: updated.username,
      tag: updated.tag,
    });

    return {
      ...updated,
      displayName: updated.username,
      uniqueId: updated.id,
      token,
    };
  }
}
