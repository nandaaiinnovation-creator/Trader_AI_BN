"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const typeorm_1 = require("typeorm");
const helpers_1 = require("./utils/helpers");
const logger_1 = require("./utils/logger");
const api_1 = __importDefault(require("./api"));
const helpers_2 = require("./utils/helpers");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api', api_1.default);
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Boot DB, Redis, WS
async function start() {
    try {
        await (0, typeorm_1.createConnection)();
        await helpers_1.redisClient.connect();
        logger_1.logger.info('DB and Redis connected');
        server.listen(process.env.PORT || 8080, () => {
            logger_1.logger.info(`Backend listening on port ${process.env.PORT || 8080}`);
        });
        // Attach WS handlers here (src/ws/socket.ts)
    }
    catch (err) {
        logger_1.logger.error({ message: 'Startup error', err });
        process.exit(1);
    }
}
start();
process.on('SIGTERM', helpers_2.gracefulShutdown);
process.on('SIGINT', helpers_2.gracefulShutdown);
