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
  signal: any; // SDP offer/answer or ICE candidate
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
        // Fallback call session ID if DB is offline
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
        callType: data.callType,
      };

      if (data.receiverId) {
        // Direct call: notify the specific receiver
        io.to(`user:${data.receiverId}`).emit('call:incoming', callData);
      } else {
        // Group call: notify all members in the conversation except caller
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
  socket.on('call:accept', async ({ callId, callerId }: { callId: string; callerId: string }) => {
    logger.info(`[WebRTC] Call ${callId} accepted by ${user.username}#${user.tag}`);

    try {
      await prisma.callSession.update({
        where: { id: callId },
        data: { status: 'ONGOING' },
      });
    } catch {}

    io.to(`user:${callerId}`).emit('call:accepted', {
      callId,
      acceptedBy: {
        id: user.userId,
        username: user.username,
        tag: user.tag,
      },
    });
  });

  // 3. Reject Call
  socket.on('call:reject', async ({ callId, callerId, reason }: { callId: string; callerId: string; reason?: string }) => {
    logger.info(`[WebRTC] Call ${callId} rejected by ${user.username}#${user.tag}`);

    try {
      await prisma.callSession.update({
        where: { id: callId },
        data: { status: 'REJECTED' },
      });
    } catch {}

    io.to(`user:${callerId}`).emit('call:rejected', {
      callId,
      rejectedBy: {
        id: user.userId,
        username: user.username,
        tag: user.tag,
      },
      reason: reason || 'Call declined',
    });
  });

  // 4. WebRTC Signaling (SDP Offer/Answer & ICE Candidates)
  socket.on('call:signal', (data: CallSignalPayload) => {
    io.to(`user:${data.targetUserId}`).emit('call:signal', {
      senderId: user.userId,
      senderUsername: user.username,
      senderTag: user.tag,
      signal: data.signal,
      callId: data.callId,
    });
  });

  // 5. End Call
  socket.on('call:end', async ({ callId, conversationId, targetUserId }: { callId?: string; conversationId?: string; targetUserId?: string }) => {
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
  });
}
