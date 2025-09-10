"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = void 0;
const zerodha_1 = require("../services/zerodha");
const logger_1 = require("../utils/logger");
function setupWebSocket(io) {
    io.on('connection', (socket) => {
        logger_1.logger.info('Client connected');
        // Forward ticks to connected clients
        const tickHandler = (tick) => {
            socket.emit('tick', tick);
        };
        zerodha_1.zerodhaService.on('tick', tickHandler);
        socket.on('disconnect', () => {
            zerodha_1.zerodhaService.off('tick', tickHandler);
            logger_1.logger.info('Client disconnected');
        });
    });
}
exports.setupWebSocket = setupWebSocket;
