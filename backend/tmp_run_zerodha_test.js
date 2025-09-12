const { zerodhaService } = require('./dist/services/zerodha');
const WebSocket = require('ws');

(async () => {
  const port = 9002;
  const WebSocketServer = WebSocket.WebSocketServer || WebSocket.Server;
  const wss = new WebSocketServer({ port });
  wss.on('connection', (ws) => {
    console.log('server: connection');
    const buf = Buffer.alloc(2 + 4 + 1 + 4);
    buf.writeUInt16BE(1, 0);
    buf.writeUInt32BE(12345, 2);
    buf.writeUInt8(0, 6);
    buf.writeFloatBE(123.45, 7);
    ws.send(buf);
  });

  zerodhaService.setCredentials({ apiKey: 'test', apiSecret: 's', accessToken: 't' });
  zerodhaService.once('tick', t => console.log('tick', t));

  try {
    await zerodhaService.connectTo(`ws://localhost:${port}`);
    console.log('connectTo returned');
  } catch (e) {
    console.error('connectTo failed', e);
  }

  setTimeout(() => { wss.close(); zerodhaService.cleanup(); }, 5000);
})();
