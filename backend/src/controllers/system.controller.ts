import { Request, Response } from 'express';
import { prisma, checkDbHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { sendSuccess } from '../utils/response';
import { getSocketStats } from '../sockets';

export class SystemController {
  static async ping(req: Request, res: Response) {
    const serverTimestamp = Date.now();
    return res.status(200).json({
      success: true,
      message: 'pong',
      serverTimestamp,
    });
  }

  static async getHealth(req: Request, res: Response) {
    const memory = process.memoryUsage();
    const [dbHealth, redisHealth] = await Promise.all([
      checkDbHealth(),
      checkRedisHealth(),
    ]);

    const socketStats = getSocketStats();

    return sendSuccess(res, {
      status: dbHealth.status === 'connected' ? 'operational' : 'degraded',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbHealth,
      redis: redisHealth,
      sockets: socketStats,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMb: Math.round(memory.rss / 1024 / 1024),
      },
    }, 'System health fetched');
  }

  static async getStats(req: Request, res: Response) {
    try {
      const [userCount, convCount, msgCount] = await Promise.all([
        prisma.user.count(),
        prisma.conversation.count(),
        prisma.message.count(),
      ]);

      return sendSuccess(res, {
        totalUsers: userCount,
        totalConversations: convCount,
        totalMessages: msgCount,
      }, 'System stats fetched');
    } catch (e: any) {
      return sendSuccess(res, {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        note: 'Database not migrated yet or offline',
      });
    }
  }
}
