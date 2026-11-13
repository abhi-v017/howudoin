import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';

export class ConversationService {
  /**
   * Get or create a 1-on-1 Direct Conversation between current user and recipient
   */
  static async getOrCreateDirectConversation(
    userId: string,
    recipientData: { recipientId?: string; recipientUsername?: string; recipientTag?: string }
  ) {
    let recipientId = recipientData.recipientId?.trim();

    if (recipientId) {
      if (recipientId.includes('#')) {
        const [u, t] = recipientId.split('#');
        const user = await prisma.user.findUnique({
          where: { username_tag: { username: u, tag: t } },
        });
        if (!user) throw new AppError(`User ${recipientId} not found`, 404);
        recipientId = user.id;
      } else {
        // Try finding by exact Unique ID (e.g. abekrox_1971)
        let user = await prisma.user.findUnique({
          where: { id: recipientId.toLowerCase() },
        });

        // If not found, try matching plain username
        if (!user) {
          const matched = await prisma.user.findMany({
            where: { username: { equals: recipientId, mode: 'insensitive' } },
          });
          if (matched.length === 1) {
            user = matched[0];
          } else if (matched.length > 1) {
            throw new AppError('Multiple users share this username. Please use their Unique ID (e.g. username_tag).', 400);
          }
        }

        if (user) {
          recipientId = user.id;
        }
      }
    } else if (recipientData.recipientUsername && recipientData.recipientTag) {
      const recipient = await prisma.user.findUnique({
        where: {
          username_tag: {
            username: recipientData.recipientUsername,
            tag: recipientData.recipientTag,
          },
        },
      });

      if (!recipient) {
        throw new AppError('Recipient user not found with the provided username and tag', 404);
      }
      recipientId = recipient.id;
    }

    if (!recipientId) {
      throw new AppError('Recipient identifier is required', 400);
    }

    if (recipientId === userId) {
      throw new AppError('Cannot start a direct conversation with yourself', 400);
    }

    // Check if a direct conversation already exists between these two users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tag: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return this.formatConversation(existing, userId);
    }

    // Create new direct conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        creatorId: userId,
        members: {
          create: [
            { userId, role: 'ADMIN' },
            { userId: recipientId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tag: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    return this.formatConversation(conversation, userId);
  }

  /**
   * Create a new Group Conversation
   */
  static async createGroupConversation(
    creatorId: string,
    data: {
      title: string;
      description?: string;
      avatarUrl?: string;
      memberIds?: string[];
    }
  ) {
    const memberIds = Array.from(new Set([creatorId, ...(data.memberIds || [])]));

    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        title: data.title,
        description: data.description,
        avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.title)}`,
        creatorId,
        members: {
          create: memberIds.map((id) => ({
            userId: id,
            role: id === creatorId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tag: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    return this.formatConversation(conversation, creatorId);
  }

  /**
   * Helper to format conversation with user-facing displayTitle and displayAvatar
   */
  static formatConversation(conv: any, userId: string) {
    const otherMembers = conv.members?.filter((m: any) => m.userId !== userId) || [];
    const isDirect = conv.type === 'DIRECT';
    const displayTitle = isDirect
      ? otherMembers[0]?.user?.username || 'Direct Chat'
      : conv.title || 'Group Chat';
    const displayAvatar = isDirect ? otherMembers[0]?.user?.avatarUrl : conv.avatarUrl;

    return {
      ...conv,
      displayTitle,
      displayAvatar,
      lastMessage: conv.messages?.[0] || conv.lastMessage || null,
    };
  }

  /**
   * Get all conversations for a user with their latest message
   */
  static async getUserConversations(userId: string) {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = memberships.map((m) => m.conversationId);

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tag: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true, tag: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => this.formatConversation(conv, userId));
  }

  /**
   * Get single conversation details
   */
  static async getConversationById(conversationId: string, userId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!member) {
      throw new AppError('You are not a member of this conversation', 403);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                tag: true,
                avatarUrl: true,
                bio: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return this.formatConversation(conversation, userId);
  }

  /**
   * Add a member to a group conversation
   */
  static async addMemberToGroup(
    conversationId: string,
    requesterId: string,
    memberData: { memberId?: string; username?: string; tag?: string }
  ) {
    const requester = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: requesterId },
      },
    });

    if (!requester || requester.role !== 'ADMIN') {
      throw new AppError('Only group admins can add new members', 403);
    }

    let targetUserId = memberData.memberId;
    if (!targetUserId && memberData.username && memberData.tag) {
      const user = await prisma.user.findUnique({
        where: {
          username_tag: { username: memberData.username, tag: memberData.tag },
        },
      });
      if (!user) throw new AppError('User not found to add to group', 404);
      targetUserId = user.id;
    }

    if (!targetUserId) {
      throw new AppError('Target member identifier is required', 400);
    }

    const existing = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
    });

    if (existing) {
      throw new AppError('User is already a member of this group', 400);
    }

    const newMember = await prisma.conversationMember.create({
      data: {
        conversationId,
        userId: targetUserId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            tag: true,
            avatarUrl: true,
            isOnline: true,
          },
        },
      },
    });

    return newMember;
  }

  /**
   * Remove member or leave group
   */
  static async removeMember(conversationId: string, requesterId: string, targetUserId: string) {
    if (requesterId !== targetUserId) {
      const requester = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: requesterId },
        },
      });
      if (!requester || requester.role !== 'ADMIN') {
        throw new AppError('Only group admins can remove other members', 403);
      }
    }

    await prisma.conversationMember.delete({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
    });

    return { removedUserId: targetUserId };
  }
}
