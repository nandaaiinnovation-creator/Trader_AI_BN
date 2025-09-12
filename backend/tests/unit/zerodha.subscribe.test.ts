import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService subscribe helpers', () => {
  test('setSubscribedTokens and getSubscribedTokens', async () => {
    const svc = new ZerodhaService();

    expect(svc.getSubscribedTokens()).toEqual([]);

    svc.setSubscribedTokens([1, 2, 3]);
    const tokens = svc.getSubscribedTokens().sort((a, b) => a - b);
    expect(tokens).toEqual([1, 2, 3]);

    await svc.cleanupAsync();
  });
});
