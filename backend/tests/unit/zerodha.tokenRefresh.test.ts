import { ZerodhaService } from '../../src/services/zerodha';

describe('ZerodhaService token refresh', () => {
  test('emits token:about-to-expire and token:refresh-required when expiry approaches', async () => {
    const svc = new ZerodhaService();

    let aboutEmitted = false;
    let refreshEmitted = false;

    svc.on('token:about-to-expire', () => {
      aboutEmitted = true;
    });

    svc.on('token:refresh-required', () => {
      refreshEmitted = true;
    });

    // Set refreshBefore to a small value so scheduling is immediate
    svc.setRefreshBeforeMs(10);

    // Set token expiry 50ms from now and schedule
    svc.setTokenExpiresAt(50, true);

    // Wait enough for the scheduled timer to fire
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(aboutEmitted).toBe(true);
    expect(refreshEmitted).toBe(true);

    await svc.cleanupAsync();
  });

  test('triggerTokenRefresh calls refresh handler directly', async () => {
    const svc = new ZerodhaService();

    let aboutEmitted = false;
    let refreshEmitted = false;

    svc.on('token:about-to-expire', () => { aboutEmitted = true; });
    svc.on('token:refresh-required', () => { refreshEmitted = true; });

    await svc.triggerTokenRefresh();

    expect(aboutEmitted).toBe(true);
    expect(refreshEmitted).toBe(true);

    await svc.cleanupAsync();
  });
});
