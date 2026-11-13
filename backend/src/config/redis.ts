import Redis from 'ioredis';
import { config } from './env';

export let redisClient: Redis | null = null;
export let isRedisConnected = false;

try {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying after 3 attempts if redis is down
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('[Redis] Connected successfully');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress spammy unhandled error events
  });

  // Attempt non-blocking connection
  redisClient.connect().catch(() => {
    // Graceful offline fallback
  });
} catch (e: any) {
  // Ignore
}

export function createRedisClientsForSockets() {
  try {
    const pubClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    pubClient.on('error', () => {});

    const subClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    subClient.on('error', () => {});

    return { pubClient, subClient };
  } catch {
    return { pubClient: null, subClient: null };
  }
}

export async function checkRedisHealth(): Promise<{ status: 'connected' | 'disconnected'; latencyMs: number; error?: string }> {
  if (!redisClient) {
    return { status: 'disconnected', latencyMs: 0, error: 'Redis client not initialized' };
  }

  const start = Date.now();
  try {
    const pong = await redisClient.ping();
    const latencyMs = Date.now() - start;
    if (pong === 'PONG') {
      return { status: 'connected', latencyMs };
    }
    return { status: 'disconnected', latencyMs, error: 'Unexpected ping response' };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return { status: 'disconnected', latencyMs, error: error?.message || 'Redis connection failed' };
  }
}
