import 'reflect-metadata';
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import createAppConnection from './db';
import { redisClient } from './utils/helpers';
import { logger } from './utils/logger';
import api from './api';
import { setupWebSocket } from './ws/socket';
import { gracefulShutdown } from './utils/helpers';
import SignalOrchestrator from './services/signalOrchestrator';
import { setOrchestrator } from './services/orchestratorSingleton';
import { setupOrchestrator } from './services/orchestrator';

const app = express();
app.use(express.json());

// Healthcheck endpoint used by Docker / orchestration and CI smoke tests
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api', api);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Boot DB, Redis, WS
export async function start() {
  try {
  await createAppConnection();
    await redisClient.connect();
    logger.info('DB and Redis connected');
    server.listen(process.env.PORT || 8080, () => {
      logger.info(`Backend listening on port ${process.env.PORT || 8080}`);
    });
    // Attach WS handlers here (src/ws/socket.ts)
    setupWebSocket(io);

    // Wire optional SignalOrchestrator behind feature flag
    // Backwards-compatible env check: support either ENABLE_SIGNAL_ORCHESTRATOR or ENABLE_ORCHESTRATOR
    const enableOrch = process.env.ENABLE_ORCHESTRATOR === '1' || process.env.ENABLE_SIGNAL_ORCHESTRATOR === 'true';
    if (enableOrch) {
      // Prefer new setupOrchestrator entrypoint when present (test-friendly)
      try {
        const orch = setupOrchestrator(io as any);
        setOrchestrator((orch as unknown) as SignalOrchestrator);
        logger.info('SignalOrchestrator (stub) enabled via setupOrchestrator');
      } catch (err) {
        // Fallback to existing SignalOrchestrator class for backward compatibility
        const orch = new SignalOrchestrator(io);
        setOrchestrator(orch);
        logger.info('SignalOrchestrator enabled');
      }
    }
  } catch (err) {
  logger.error({ message: 'Startup error', err });
    process.exit(1);
  }
}

if (require.main === module) {
  start().catch(err => {
    logger.error({ message: 'Failed to start', err });
    process.exit(1);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
