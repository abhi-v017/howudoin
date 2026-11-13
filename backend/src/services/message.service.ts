import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';

export class MessageService {
  /**
   * Send a new message in a conversation
   */
  static async sendMessage(
    userId: string,
    data: {
      conversationId: string;
      content?: string;
      type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'SYSTEM';
      mediaUrl?: string;
      mediaName?: string;
      mediaSize?: number;
      mediaMimeType?: string;
      replyToId?: string;
    }
  ) {
    // 1. Verify user is a member of the conversation
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('You are not a member of this conversation', 403);
    }

    // 2. Create message
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
        type: data.type || 'TEXT',
        mediaUrl: data.mediaUrl,
        mediaName: data.mediaName,
        mediaSize: data.mediaSize,
        mediaMimeType: data.mediaMimeType,
        replyToId: data.replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            tag: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: { id: true, username: true, tag: true },
            },
          },
        },
        receipts: true,
      },
    });

    // 3. Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Get paginated messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    userId: string,
    query: { cursor?: string; limit?: number }
  ) {
    const limit = query.limit || 30;

    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!membership) {
      throw new AppError('You are not a member of this conversation', 403);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            tag: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            type: true,
            sender: {
              select: { id: true, username: true, tag: true },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    // Return in chronological order (oldest to newest)
    return {
      messages: messages.reverse(),
      nextCursor,
    };
  }

  /**
   * Mark messages in a conversation as read
   */
  static async markConversationAsRead(conversationId: string, userId: string) {
    // Find unread messages where recipient is this user
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
      },
      select: { id: true },
      take: 100,
    });

    const messageIds = unreadMessages.map((m) => m.id);

    for (const msgId of messageIds) {
      await prisma.messageReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: msgId,
            userId,
          },
        },
        update: { status: 'READ' },
        create: {
          messageId: msgId,
          userId,
          status: 'READ',
        },
      });
    }

    return { markedCount: messageIds.length };
  }

  /**
   * Edit a sent message
   */
  static async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId !== userId) {
      throw new AppError('You can only edit your own messages', 403);
    }

    if (message.isDeleted) {
      throw new AppError('Cannot edit a deleted message', 400);
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
      },
      include: {
        sender: {
          select: { id: true, username: true, tag: true, avatarUrl: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a sent message (soft delete)
   */
  static async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId !== userId) {
      throw new AppError('You can only delete your own messages', 403);
    }

    const deleted = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message was deleted',
        mediaUrl: null,
      },
    });

    return deleted;
  }
}
