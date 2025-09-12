import WebSocket, { WebSocketServer } from 'ws';
import { zerodhaService } from '../../src/services/zerodha';

// Small helper to build a minimal 'ltp' binary packet as the parser expects
function buildLtpPacket(instrumentToken: number, price: number) {
  const buffer = Buffer.alloc(2 + 4 + 1 + 4); // numberOfPackets + token + flags + ltp(4)
  buffer.writeUInt16BE(1, 0); // one packet
  let idx = 2;
  buffer.writeUInt32BE(instrumentToken, idx); idx += 4;
  const flags = 0x00; // ltp
  buffer.writeUInt8(flags, idx); idx += 1;
  // ltp is a 4-byte float as used by parseBinaryTick
  buffer.writeFloatBE(price, idx);
  return buffer;
}

describe('ZerodhaService integration (mock WS)', () => {
  let wss: WebSocketServer;
  let port = 9001;

  beforeAll(async () => {
    wss = new WebSocketServer({ port });
    await new Promise<void>((resolve) => wss.once('listening', () => resolve()));
  });

  afterAll(async () => {
    if (wss) {
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });

  test('parses ltp packet and emits tick', async () => {
    // Inject test credentials and connect to mock server
    zerodhaService.setCredentials({ apiKey: 'test', apiSecret: 'secret', accessToken: 'token' });

    // Prepare to send the packet when a client connects
    wss.on('connection', (ws) => {
      const pkt = buildLtpPacket(12345, 456.78);
      ws.send(pkt);
    });

    // Await the tick via a Promise
    const tickPromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for tick')), 5000);
      zerodhaService.once('tick', (tick) => {
        clearTimeout(timeout);
        resolve(tick);
      });
    });

    // connect the service to the mock WS and await connection
    await zerodhaService.connectTo(`ws://localhost:${port}`);

    const tick = await tickPromise;
    expect(tick).toBeDefined();
    expect(tick.mode).toBe('ltp');
    expect(tick.instrumentToken).toBe(12345);
    expect(typeof tick.lastPrice).toBe('number');

    // cleanup service and server
    await zerodhaService.cleanupAsync();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  }, 10000);
});
