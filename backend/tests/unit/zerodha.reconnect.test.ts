import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService reconnect scheduling (unit)', () => {
  test('triggerReconnect increments reconnectAttempts and schedules a timer', async () => {
    const svc = new ZerodhaService();
    // ensure a deterministic small max attempts for the unit test
    (svc as any).maxReconnectAttempts = 3;
    // ensure starting state
    (svc as any).reconnectAttempts = 0;

    svc.triggerReconnect();

    // wait briefly for scheduleReconnect to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(svc.getReconnectAttempts()).toBeGreaterThanOrEqual(1);
  });
});
