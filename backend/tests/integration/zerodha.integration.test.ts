import WebSocket, { WebSocketServer } from 'ws';
import { zerodhaService } from '../../src/services/zerodha';

// Small helper to build a minimal 'ltp' binary packet as the parser expects
function buildLtpPacket(instrumentToken: number, price: number) {
  const buffer = Buffer.alloc(2 + 4 + 1 + 8); // numberOfPackets + token + flags + ltp(8)
  buffer.writeUInt16BE(1, 0); // one packet
  let idx = 2;
  buffer.writeUInt32BE(instrumentToken, idx); idx += 4;
  const flags = 0x00; // ltp
  buffer.writeUInt8(flags, idx); idx += 1;
  // writeFloatBE expects 4 bytes for float; code in parseBinaryTick uses readFloatBE -> 4 bytes
  buffer.writeFloatBE(price, idx);
  return buffer;
}

describe('ZerodhaService integration (mock WS)', () => {
  let wss: WebSocketServer;
  let port = 9001;

  beforeAll((done) => {
    wss = new WebSocketServer({ port }, () => done());
  });

  afterAll(async () => {
    try { wss.close(); } catch (e) {}
  });

  test('parses ltp packet and emits tick', (done) => {
    // Inject test credentials and connect to mock server
    zerodhaService.setCredentials({ apiKey: 'test', apiSecret: 'secret', accessToken: 'token' });

    zerodhaService.once('tick', (tick) => {
      try {
        expect(tick).toBeDefined();
        expect(tick.mode).toBe('ltp');
        expect(tick.instrumentToken).toBe(12345);
        expect(typeof tick.lastPrice).toBe('number');
        done();
      } catch (err) {
        done(err);
      } finally {
        zerodhaService.cleanup();
      }
    });

    wss.on('connection', (ws) => {
      // send a small LTP packet
      const pkt = buildLtpPacket(12345, 456.78);
      // ws.send accepts Buffer
      ws.send(pkt);
    });

    // connect the service to the mock WS
    zerodhaService.connectTo(`ws://localhost:${port}`).catch(done);
  }, 10000);
});
