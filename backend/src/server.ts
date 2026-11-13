import http from 'http';
import app from './app';
import { config } from './config/env';
import { initSocketServer } from './sockets';
import { prisma } from './config/database';
import { logger } from './utils/logger';

const server = http.createServer(app);

// Initialize Socket.io
initSocketServer(server);

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`==================================================`);
  logger.info(`🚀 ChatApp Backend Server running on port ${PORT}`);
  logger.info(`📡 API endpoint:        http://localhost:${PORT}/api/v1`);
  logger.info(`🛠️ Diagnostics Dashboard: http://localhost:${PORT}/`);
  logger.info(`🔌 WebSocket & WebRTC:  ws://localhost:${PORT}`);
  logger.info(`==================================================`);
});

// Graceful Shutdown
async function handleShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP & WebSocket server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
