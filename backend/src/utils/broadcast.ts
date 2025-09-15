import { Server } from 'socket.io';

let io: Server | null = null;

export function registerBroadcaster(server: Server) {
  io = server;
}

export function getBroadcaster() {
  return io;
}

export function emitEvent(event: string, payload: any) {
  if (!io) return false;
  try {
    io.emit(event, payload);
    return true;
  } catch (err) {
    return false;
  }
}

export default {
  registerBroadcaster,
  getBroadcaster,
  emitEvent,
};
