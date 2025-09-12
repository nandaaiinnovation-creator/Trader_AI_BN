import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService auto-resubscribe', () => {
  test('setAutoResubscribe toggles behavior', async () => {
    const svc = new ZerodhaService();
    expect(svc.getAutoResubscribe()).toBe(true);

    svc.setAutoResubscribe(false);
    expect(svc.getAutoResubscribe()).toBe(false);

    svc.setAutoResubscribe(true);
    expect(svc.getAutoResubscribe()).toBe(true);

    await svc.cleanupAsync();
  });
});
