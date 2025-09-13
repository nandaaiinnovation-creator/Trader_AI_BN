import WebSocket, { WebSocketServer } from 'ws';
// ...existing code...
import { ZerodhaService } from '../../src/services/zerodha';

// centralized teardown helper
const teardown = require('../helpers/teardown');

describe('ZerodhaService additional integration tests (mock WS, timers)', () => {
  let wss: WebSocketServer | undefined;
  let svc: ZerodhaService | undefined;

  afterEach(async () => {
    try {
      await svc?.cleanupAsync();
    } catch (e) {
      // ignore
    }
    // ensure we remove any listeners added by tests
    svc?.removeAllListeners('token:about-to-expire');
    svc?.removeAllListeners('token:refresh-required');
    // restore timers
    try { jest.useRealTimers(); } catch (e) {}

    // Ensure test-created WebSocketServer is closed so Jest exits cleanly
    if (wss) {
      try {
        await new Promise<void>((resolve) => wss!.close(() => resolve()));
      } catch (e) {
        // ignore
      }
      wss = undefined;
    }
  });

  afterAll(async () => {
    await teardown();
  });

  test('schedules token refresh and emits events', async () => {
    jest.useFakeTimers();

  svc = new ZerodhaService();
  const aboutToExpire = jest.fn();
  const refreshRequired = jest.fn();

  svc.on('token:about-to-expire', aboutToExpire);
  svc.on('token:refresh-required', refreshRequired);

  // Set token expiry to a short time in the future (2s). scheduleTokenRefresh
  // will schedule immediate (0ms) timeout because we subtract 60s in calculation.
  (svc as any).tokenExpiresAt = Date.now() + 2000;

  // Call private method via cast for testing
  (svc as any).scheduleTokenRefresh();

    // Run pending timers
    jest.runOnlyPendingTimers();
    // Allow any microtasks to run
    await Promise.resolve();

  expect(aboutToExpire).toHaveBeenCalled();
  expect(refreshRequired).toHaveBeenCalled();
  });

  test('attempts reconnect when socket closes', async () => {
    // Use real timers for reconnect tests because the service uses setTimeout
    // with jitter and unref(); fake timers may not interact reliably with
    // the WebSocket internals across environments.
    svc = new ZerodhaService();

    // Reduce allowed attempts to keep the test deterministic
    (svc as any).maxReconnectAttempts = 3;

    // Ensure initial state
    (svc as any).reconnectAttempts = 0;

    // Directly trigger scheduleReconnect to test backoff scheduling
    (svc as any).scheduleReconnect();

    // Wait briefly for the method to increment reconnectAttempts
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect((svc as any).reconnectAttempts).toBeGreaterThanOrEqual(1);
  }, 10000);
});
