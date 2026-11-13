import { Server, Socket } from 'socket.io';
import { MessageService } from '../services/message.service';
import { logger } from '../utils/logger';

export function registerChatHandlers(io: Server, socket: Socket, user: { userId: string; username: string; tag: string }) {
  // Join conversation room
  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.debug(`[Socket] User ${user.username}#${user.tag} joined conversation:${conversationId}`);
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Realtime message sending via WebSockets (also supported via REST)
  socket.on('message:send', async (data, callback) => {
    try {
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

  // Typing indicators
  socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:status', {
      conversationId,
      userId: user.userId,
      username: user.username,
      tag: user.tag,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:status', {
      conversationId,
      userId: user.userId,
      username: user.username,
      tag: user.tag,
      isTyping: false,
    });
  });

  // Read receipts
  socket.on('message:read', async ({ conversationId }: { conversationId: string }) => {
    try {
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
