import 'reflect-metadata';
import 'reflect-metadata';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { createConnection } from 'typeorm';
import { redisClient } from './utils/helpers';
import { logger } from './utils/logger';
import api from './api';
import { setupWebSocket } from './ws/socket';
import { gracefulShutdown } from './utils/helpers';

const app = express();
app.use(express.json());
app.use('/api', api);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Boot DB, Redis, WS
async function start() {
  try {
    await createConnection();
    await redisClient.connect();
    logger.info('DB and Redis connected');
    server.listen(process.env.PORT || 8080, () => {
      logger.info(`Backend listening on port ${process.env.PORT || 8080}`);
    });
    // Attach WS handlers here (src/ws/socket.ts)
  } catch (err) {
  logger.error({ message: 'Startup error', err });
    process.exit(1);
  }
}

start();

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
