import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService subscribe rate limit', () => {
  test('suspends subscribes when too many attempts in window', async () => {
    const svc = new ZerodhaService();
    svc.setRateLimitOptions({ windowMs: 100, maxPerWindow: 3, backoffMs: 200 });

    // simulate rapid subscribe sends
    svc.recordSubscribeAttempt();
    svc.recordSubscribeAttempt();
    svc.recordSubscribeAttempt();

    // not yet suspended
    expect(svc.isSubscribeSuspended()).toBe(false);

    // one more attempt breaches the limit
    svc.recordSubscribeAttempt();

    expect(svc.isSubscribeSuspended()).toBe(true);

    // wait for backoff to expire
    await new Promise(resolve => setTimeout(resolve, 250));

    expect(svc.isSubscribeSuspended()).toBe(false);

    await svc.cleanupAsync();
  });
});
