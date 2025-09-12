# Integration Tests (backend)

This project includes a small set of integration-style smoke tests that run entirely locally and do not call live external services. They use an in-process `ws` WebSocketServer to simulate the Zerodha WebSocket and mock HTTP responses where required.

Files of interest

- `backend/tests/integration/zerodha.integration.test.ts` — basic mock WS integration test that asserts the service parses an LTP packet and emits `tick`.
- `backend/tests/integration/zerodha.extra.integration.test.ts` — additional integration scenarios (teardown correctness and more).
- `backend/tests/integration/zerodha.jitter.integration.test.ts` — smoke test that simulates jitter (delayed/dropped messages and intermittent socket closes) to exercise reconnect and auto-resubscribe behavior.

How to run integration tests locally

1. From the repository root run the backend test command:

```powershell
cd backend
npm test --silent
```

2. If you prefer to run only integration tests you can use Jest's `-t` or `--testPathPattern` flags. For example:

```powershell
cd backend
npm test --silent -- --testPathPattern=integration
```

CI-safety and best practices

- Tests must not open connections to production services. The integration tests here use a local `ws` server and mocked HTTP calls to keep CI hermetic.
- Keep integration tests short (a few seconds) to avoid slowing CI. The jitter test runs for ~2 seconds by default.
- Always clean up resources in tests: close WebSocket servers, clear timers, and call `cleanupAsync()` on `ZerodhaService` to avoid open-handle failures.
- Prefer deterministic wiring in unit tests; use test-only helpers on `ZerodhaService` (e.g., `setCredentials`, `setRefreshBeforeMs`, `triggerTokenRefresh`, `setRateLimitOptions`) instead of relying on real timers.

If you'd like I can add a small script/`npm` task to run only integration tests or to run them under `--detectOpenHandles` when debugging leaks.

New npm scripts

- `npm run test:integration` — run only the integration tests (tests/integration).
- `npm run test:integration:debug` — run integration tests with Jest's `--detectOpenHandles` and `--runInBand` for debugging open handles.

Examples

```powershell
cd backend
npm run test:integration

# debug open handles while running only integration tests
npm run test:integration:debug
```
