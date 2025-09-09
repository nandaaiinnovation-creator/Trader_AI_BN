import { Server, Socket } from 'socket.io';
import { zerodhaService } from '../services/zerodha';
import { logger } from '../utils/logger';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected');

    // Forward ticks to connected clients
    const tickHandler = (tick: any) => {
      socket.emit('tick', tick);
    };

    zerodhaService.on('tick', tickHandler);

    socket.on('disconnect', () => {
      zerodhaService.off('tick', tickHandler);
      logger.info('Client disconnected');
    });
  });
}
