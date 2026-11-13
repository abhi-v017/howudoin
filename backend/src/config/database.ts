import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function checkDbHealth(): Promise<{ status: 'connected' | 'disconnected'; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: 'connected', latencyMs };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return { status: 'disconnected', latencyMs, error: error?.message || 'Database connection error' };
  }
}
