import 'reflect-metadata';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import createAppConnection from './db';
import { redisClient } from './utils/helpers';
import { logger } from './utils/logger';
import api from './api';
import { setupWebSocket } from './ws/socket';
import { registerBroadcaster } from './utils/broadcast';
import { gracefulShutdown } from './utils/helpers';
import SignalOrchestrator from './services/signalOrchestrator';
import { setOrchestrator } from './services/orchestratorSingleton';
import { setupOrchestrator } from './services/orchestrator';
import { createRulesEngineFromDb } from './services/rules';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { demoEmitter } from './demo/emitter';

const app = express();
app.use(express.json());

// Healthcheck endpoint used by Docker / orchestration and CI smoke tests
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.use('/api', api);

const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: '*' } });

// register io with broadcast helper so route handlers can emit without requiring index
registerBroadcaster(io);

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

    // Demo Mode: emit synthetic ticks and signals to Socket.IO and orchestrator
    if (process.env.DEMO_MODE === 'true') {
      logger.info('Demo Mode enabled: streaming synthetic ticks and signals');
      demoEmitter.on('tick', (t: any) => {
        try { io.emit('tick', t); } catch (e) {}
      });
      demoEmitter.on('signal', async (s: any) => {
        try {
          io.emit('signal', s);
        } catch (e) {}
      });
      demoEmitter.start();
    }

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

    // Wire optional RulesEngine behind feature flag
    const enableRules = process.env.ENABLE_RULES_ENGINE === '1' || process.env.ENABLE_RULES_ENGINE === 'true';
    if (enableRules) {
      try {
        const engine = await createRulesEngineFromDb();

        // Attempt to load concrete rule implementations from services/rules directory
        const rulesDir = path.join(__dirname, 'services', 'rules');
        const files = fs.existsSync(rulesDir) ? fs.readdirSync(rulesDir).filter(f => f.endsWith('.js') || f.endsWith('.ts')) : [];

        for (const file of files) {
          try {
            const modPath = path.join(rulesDir, file);
            // Use dynamic import with file URL to avoid `require` and satisfy lint rules
            const mod = await import(pathToFileURL(modPath).href);
          const RuleClass = mod && (mod.default || mod);
            if (typeof RuleClass === 'function') {
              // instantiate and register
              const instance = new RuleClass();
              const ruleName = instance.name || path.basename(file, path.extname(file));
              // register a wrapper that delegates to the instance.evaluate(ctx)
              engine.registerRule(ruleName, async (input: any, _cfg?: any) => {
                try {
                  const res = await instance.evaluate(input);
                  return { id: ruleName, name: ruleName, passed: !!res.passed, score: res.score || 0, meta: res };
                } catch (err) {
                  return { id: ruleName, name: ruleName, passed: false, meta: { error: `${err}` } };
                }
              });
            }
          } catch (err) {
            logger.warn({ message: `Failed to load rule module ${file}`, err });
          }
        }

        logger.info('RulesEngine loaded and registered rule implementations');
      } catch (err) {
        logger.error({ message: 'Failed to initialize RulesEngine', err });
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
