import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService refresh handler', () => {
  test('pluggable refresh handler supplies token used by service', async () => {
    const svc = new ZerodhaService();

    // register a handler that returns a token
    svc.setRefreshHandler(async () => {
      return 'HANDLED_TOKEN';
    });

    // trigger internal refresh path
    await svc.triggerTokenRefresh();

    // The credentials should now contain accessToken set by the handler
    // Use fetchQuote to verify the token is used (mocking axios not needed here;
    // we simply assert credentials were updated)
    expect((svc as any).credentials?.accessToken).toBe('HANDLED_TOKEN');

    await svc.cleanupAsync();
  });
});
