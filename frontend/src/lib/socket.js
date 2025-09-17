import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    // auto-connect to same origin
    socket = io('/', { transports: ['websocket'], autoConnect: true });
  }
  return socket;
}

export default getSocket;
