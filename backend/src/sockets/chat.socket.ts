import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { MessageService } from '../services/message.service';
import { logger } from '../utils/logger';

export function registerChatHandlers(
  io: Server,
  socket: Socket,
  user: { userId: string; username: string; tag: string }
) {
  // Join conversation room (with strict authorization check)
  socket.on('conversation:join', async (conversationId: any) => {
    try {
      if (!conversationId || typeof conversationId !== 'string') return;

      // Verify user is a member of this conversation before joining socket room
      const isMember = await prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.userId,
          },
        },
      });

      if (!isMember) {
        logger.warn(`[Socket] Unauthorized join attempt by ${user.username}#${user.tag} to conversation:${conversationId}`);
        return;
      }

      socket.join(`conversation:${conversationId}`);
      logger.debug(`[Socket] User ${user.username}#${user.tag} joined conversation:${conversationId}`);
    } catch (err: any) {
      logger.error('[Socket] conversation:join error:', err.message);
    }
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId: any) => {
    if (conversationId && typeof conversationId === 'string') {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  // Realtime message sending via WebSockets (also supported via REST)
  socket.on('message:send', async (data: any, callback) => {
    try {
      if (!data || !data.conversationId) {
        throw new Error('conversationId is required to send message');
      }

      const message = await MessageService.sendMessage(user.userId, {
        conversationId: data.conversationId,
        content: data.content,
        type: data.type,
        mediaUrl: data.mediaUrl,
        mediaName: data.mediaName,
        mediaSize: data.mediaSize,
        mediaMimeType: data.mediaMimeType,
        replyToId: data.replyToId,
      });

      // Broadcast to all sockets in this conversation room
      io.to(`conversation:${data.conversationId}`).emit('message:new', message);

      if (typeof callback === 'function') {
        callback({ success: true, message });
      }
    } catch (error: any) {
      logger.error('[Socket] message:send error:', error.message);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Typing indicators with safe destructuring
  socket.on('typing:start', (payload: any) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      socket.to(`conversation:${conversationId}`).emit('typing:status', {
        conversationId,
        userId: user.userId,
        username: user.username,
        tag: user.tag,
        isTyping: true,
      });
    } catch (e: any) {
      logger.warn('[Socket] typing:start error:', e.message);
    }
  });

  socket.on('typing:stop', (payload: any) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      socket.to(`conversation:${conversationId}`).emit('typing:status', {
        conversationId,
        userId: user.userId,
        username: user.username,
        tag: user.tag,
        isTyping: false,
      });
    } catch (e: any) {
      logger.warn('[Socket] typing:stop error:', e.message);
    }
  });

  // Read receipts with safe destructuring
  socket.on('message:read', async (payload: any) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;

      await MessageService.markConversationAsRead(conversationId, user.userId);
      socket.to(`conversation:${conversationId}`).emit('message:read_receipt', {
        conversationId,
        userId: user.userId,
        timestamp: new Date(),
      });
    } catch (e: any) {
      logger.warn('[Socket] message:read error:', e.message);
    }
  });
}
