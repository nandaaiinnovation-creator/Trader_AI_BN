import { ZerodhaService } from '../../src/services/zerodha';
import axios from 'axios';

jest.mock('axios');

describe('ZerodhaService OAuth/token refresh smoke', () => {
  test('external refresh handler can provide new token and service uses it', async () => {
    const svc = new ZerodhaService();

    // Mock axios.get used by fetchQuote to verify Authorization header is set
    (axios.get as jest.Mock).mockImplementation((url, opts) => {
      // Return a successful fake quote response if Authorization header present
      const auth = opts?.headers?.Authorization || '';
      if (auth && auth.includes('token')) {
        return Promise.resolve({ data: { data: { 'FAKE:1': { last_price: 123 } } } });
      }
      return Promise.reject(new Error('unauthorized'));
    });

    // Attach an external handler that listens for about-to-expire and supplies a token
    svc.on('token:about-to-expire', async () => {
      // Simulate external refresh -> set credentials with accessToken
      svc.setCredentials({ apiKey: 'APIKEY', apiSecret: 'SECRET', accessToken: 'NEWTOKEN' });
      // Also set token expiry in future so schedule doesn't immediately fire again
      svc.setTokenExpiresAt(60 * 1000, true);
    });

    // Use triggerTokenRefresh to synchronously run the refresh flow
    await svc.setRefreshBeforeMs(0);
    await svc.triggerTokenRefresh();

    // Now fetchQuote should succeed (uses the dummy axios mock above)
    const quote = await svc.fetchQuote('FAKE:1');
    expect(quote).toBeDefined();

    await svc.cleanupAsync();
  });
});
