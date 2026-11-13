import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

// In-memory fallback if Redis is not yet running
const localUserSockets = new Map<string, Set<string>>();

export async function userConnected(io: Server, socket: Socket, userId: string) {
  // Add to local map
  if (!localUserSockets.has(userId)) {
    localUserSockets.set(userId, new Set());
  }
  localUserSockets.get(userId)!.add(socket.id);

  // Join user's personal notification room
  socket.join(`user:${userId}`);

  // Update Redis presence
  if (redisClient) {
    try {
      await redisClient.sadd(`presence:user:${userId}`, socket.id);
      await redisClient.sadd('presence:online_users', userId);
    } catch (e: any) {
      logger.warn('[Presence] Redis update failed:', e.message);
    }
  }

  // Update DB online status
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });
  } catch (e) {
    // DB might be reconnecting
  }

  // Broadcast user online event to friends/groups
  io.emit('presence:update', {
    userId,
    isOnline: true,
    lastSeen: new Date(),
  });
}

export async function userDisconnected(io: Server, socket: Socket, userId: string) {
  // Remove from local map
  const userSockets = localUserSockets.get(userId);
  if (userSockets) {
    userSockets.delete(socket.id);
    if (userSockets.size === 0) {
      localUserSockets.delete(userId);
    }
  }

  // Update Redis presence
  let isStillOnline = false;
  if (redisClient) {
    try {
      await redisClient.srem(`presence:user:${userId}`, socket.id);
      const remaining = await redisClient.scard(`presence:user:${userId}`);
      if (remaining === 0) {
        await redisClient.srem('presence:online_users', userId);
      } else {
        isStillOnline = true;
      }
    } catch {
      isStillOnline = (localUserSockets.get(userId)?.size || 0) > 0;
    }
  } else {
    isStillOnline = (localUserSockets.get(userId)?.size || 0) > 0;
  }

  if (!isStillOnline) {
    const lastSeen = new Date();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen },
      });
    } catch (e) {}

    io.emit('presence:update', {
      userId,
      isOnline: false,
      lastSeen,
    });
  }
}

export function getConnectedUserCount(): { totalConnections: number; distinctUsers: number } {
  let totalConnections = 0;
  localUserSockets.forEach((sockets) => {
    totalConnections += sockets.size;
  });
  return {
    totalConnections,
    distinctUsers: localUserSockets.size,
  };
}
