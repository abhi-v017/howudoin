import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface CallInitiatePayload {
  conversationId: string;
  receiverId?: string;
  callType: 'AUDIO' | 'VIDEO';
}

interface CallSignalPayload {
  targetUserId: string;
  signal: any;
  callId?: string;
}

export function registerWebRTCHandlers(
  io: Server,
  socket: Socket,
  user: { userId: string; username: string; tag: string }
) {
  // 1. Initiate Call
  socket.on('call:initiate', async (data: CallInitiatePayload, callback) => {
    try {
      if (!data || !data.conversationId) {
        throw new Error('conversationId is required to initiate call');
      }

      logger.info(`[WebRTC] Call initiated by ${user.username}#${user.tag} in conv:${data.conversationId}`);

      let callSessionId: string | undefined;

      try {
        const session = await prisma.callSession.create({
          data: {
            conversationId: data.conversationId,
            callerId: user.userId,
            receiverId: data.receiverId,
            callType: data.callType || 'AUDIO',
            status: 'RINGING',
          },
        });
        callSessionId = session.id;
      } catch (e) {
        callSessionId = `call_${Date.now()}`;
      }

      const callData = {
        callId: callSessionId,
        conversationId: data.conversationId,
        caller: {
          id: user.userId,
          username: user.username,
          tag: user.tag,
        },
        callType: data.callType || 'AUDIO',
      };

      if (data.receiverId) {
        io.to(`user:${data.receiverId}`).emit('call:incoming', callData);
      } else {
        socket.to(`conversation:${data.conversationId}`).emit('call:incoming', callData);
      }

      if (typeof callback === 'function') {
        callback({ success: true, callId: callSessionId });
      }
    } catch (error: any) {
      logger.error('[WebRTC] call:initiate error:', error.message);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // 2. Accept Call
  socket.on('call:accept', async (data: any) => {
    try {
      const callId = data?.callId;
      const callerId = data?.callerId;
      if (!callerId) return;

      logger.info(`[WebRTC] Call ${callId} accepted by ${user.username}#${user.tag}`);

      if (callId) {
        try {
          await prisma.callSession.update({
            where: { id: callId },
            data: { status: 'ONGOING' },
          });
        } catch {}
      }

      io.to(`user:${callerId}`).emit('call:accepted', {
        callId,
        acceptedBy: {
          id: user.userId,
          username: user.username,
          tag: user.tag,
        },
      });
    } catch (err: any) {
      logger.error('[WebRTC] call:accept error:', err.message);
    }
  });

  // 3. Reject Call
  socket.on('call:reject', async (data: any) => {
    try {
      const callId = data?.callId;
      const callerId = data?.callerId;
      const reason = data?.reason;
      if (!callerId) return;

      logger.info(`[WebRTC] Call ${callId} rejected by ${user.username}#${user.tag}`);

      if (callId) {
        try {
          await prisma.callSession.update({
            where: { id: callId },
            data: { status: 'REJECTED' },
          });
        } catch {}
      }

      io.to(`user:${callerId}`).emit('call:rejected', {
        callId,
        rejectedBy: {
          id: user.userId,
          username: user.username,
          tag: user.tag,
        },
        reason: reason || 'Call declined',
      });
    } catch (err: any) {
      logger.error('[WebRTC] call:reject error:', err.message);
    }
  });

  // 4. WebRTC Signaling (SDP Offer/Answer & ICE Candidates)
  socket.on('call:signal', (data: CallSignalPayload) => {
    try {
      if (!data || !data.targetUserId) return;

      io.to(`user:${data.targetUserId}`).emit('call:signal', {
        senderId: user.userId,
        senderUsername: user.username,
        senderTag: user.tag,
        signal: data.signal,
        callId: data.callId,
      });
    } catch (err: any) {
      logger.error('[WebRTC] call:signal error:', err.message);
    }
  });

  // 5. End Call
  socket.on('call:end', async (data: any) => {
    try {
      const callId = data?.callId;
      const conversationId = data?.conversationId;
      const targetUserId = data?.targetUserId;

      logger.info(`[WebRTC] Call ended by ${user.username}#${user.tag}`);

      if (callId) {
        try {
          const session = await prisma.callSession.findUnique({ where: { id: callId } });
          if (session) {
            const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
            await prisma.callSession.update({
              where: { id: callId },
              data: {
                status: 'COMPLETED',
                endedAt: new Date(),
                durationSec: duration,
              },
            });
          }
        } catch {}
      }

      const payload = {
        callId,
        endedBy: user.userId,
      };

      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('call:ended', payload);
      } else if (conversationId) {
        io.to(`conversation:${conversationId}`).emit('call:ended', payload);
      }
    } catch (err: any) {
      logger.error('[WebRTC] call:end error:', err.message);
    }
  });
}
