/* Example: wiring a pluggable refresh handler for ZerodhaService
   This file demonstrates a safe, local example that does not call real networks.
   It shows:
   - how to register a refresh handler
   - how the handler can fetch a token from an in-memory store or a mocked HTTP flow
   - how to unregister the handler

   Run it in the repository root with: `node --loader ts-node/esm backend/examples/refresh-handler.example.ts`
   (or adapt to your local TypeScript runner)
*/

import { zerodhaService } from '../src/services/zerodha';

// A small in-memory token store used by this example. In production, replace
// this with a secure secret store (vault, env, DB, etc.).
let inMemoryToken: string | undefined = undefined;

// Mocked function that simulates calling an auth server to refresh a token.
// In real code, this would call your backend that exchanges a refresh token
// or performs the OAuth flow securely.
async function mockFetchFreshToken(): Promise<string | undefined> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 100));

  // Return a token if available, otherwise undefined
  if (!inMemoryToken) return undefined;
  return `${inMemoryToken}-refreshed-${Date.now()}`;
}

// The handler we register with the ZerodhaService. It should be fast and
// return a new access token or `undefined` when refresh isn't possible.
async function refreshHandler(): Promise<string | undefined> {
  try {
    // Prefer reading from a secure store; fallback to mock fetch
    const token = await mockFetchFreshToken();
    return token;
  } catch (err) {
    console.error('Refresh handler error', err);
    return undefined;
  }
}

async function demo() {
  // Listen to token events
  zerodhaService.on('token:refreshed', (token: string) => {
    console.log('Token was refreshed and set on service:', token);
  });

  zerodhaService.on('token:refresh-required', () => {
    console.log('Service requested an external token refresh (token:refresh-required)');
  });

  // Initialize the in-memory token for this demo
  inMemoryToken = 'example-token-123';

  // Register the refresh handler
  zerodhaService.setRefreshHandler(refreshHandler);

  // Simulate a triggered refresh flow
  console.log('Triggering token refresh...');
  await zerodhaService.triggerTokenRefresh();

  // Unregister the handler (for example during shutdown)
  zerodhaService.setRefreshHandler(null);

  // Trigger again to see fallback behavior
  console.log('Triggering token refresh after unregistering handler...');
  await zerodhaService.triggerTokenRefresh();

  // Cleanup service resources
  await zerodhaService.cleanupAsync();
}

// Run demo when executed directly
if (require.main === module) {
  demo().catch((err) => {
    console.error('Demo failed', err);
    process.exit(1);
  });
}
