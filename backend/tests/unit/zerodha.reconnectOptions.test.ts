import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService reconnect options', () => {
  test('setReconnectOptions adjusts base and jitter for deterministic delay', async () => {
    const svc = new ZerodhaService();
    svc.setReconnectOptions({ baseMs: 10, maxDelayMs: 100, jitterFn: () => 5, maxAttempts: 2 });
    // reset attempts
    (svc as any).reconnectAttempts = 0;

    svc.triggerReconnect();
    // wait briefly
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(svc.getReconnectAttempts()).toBeGreaterThanOrEqual(1);

    // stop any scheduled timer
    svc.stopReconnect();
  });
});
