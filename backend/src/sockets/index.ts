import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisClientsForSockets } from '../config/redis';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import { userConnected, userDisconnected, getConnectedUserCount } from './presence.socket';
import { registerChatHandlers } from './chat.socket';
import { registerWebRTCHandlers } from './webrtc.socket';

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: (requestOrigin, callback) => {
        callback(null, requestOrigin || true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Setup Redis Adapter if Redis is reachable
  try {
    const { pubClient, subClient } = createRedisClientsForSockets();
    if (pubClient && subClient) {
      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          logger.info('[Socket.io] Redis adapter configured for horizontal scaling');
        })
        .catch(() => {
          logger.warn('[Socket.io] Running in single-node mode (Redis adapter standby)');
        });
    }
  } catch (e: any) {
    logger.warn('[Socket.io] Standalone memory adapter active');
  }

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers['authorization'] as string)?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required for WebSocket connection'));
      }

      const decoded = verifyToken(token as string);
      (socket as any).user = decoded;
      next();
    } catch (err: any) {
      logger.warn('[Socket.io] Auth failed:', err.message);
      next(new Error('Invalid or expired socket authentication token'));
    }
  });

  // On Connection
  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    logger.info(`[Socket.io] Client connected: ${user.username}#${user.tag} (Socket ID: ${socket.id})`);

    // Track presence
    await userConnected(io, socket, user.userId);

    // Register Chat and WebRTC handlers
    registerChatHandlers(io, socket, user);
    registerWebRTCHandlers(io, socket, user);

    // On Disconnect
    socket.on('disconnect', async () => {
      logger.info(`[Socket.io] Client disconnected: ${user.username}#${user.tag} (Socket ID: ${socket.id})`);
      await userDisconnected(io, socket, user.userId);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return ioInstance;
}

export function getSocketStats() {
  return getConnectedUserCount();
}
