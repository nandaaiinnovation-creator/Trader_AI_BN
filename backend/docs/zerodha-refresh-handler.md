# Zerodha `setRefreshHandler` Usage

This document shows how to wire a pluggable refresh handler into the `ZerodhaService` instance so your application can provide access tokens from an external workflow (for example, a secure token store or an OAuth refresh flow).

Key points

- `ZerodhaService#setRefreshHandler(handler)` accepts a nullable async function: `(() => Promise<string | undefined>) | null`.
- The handler should return a new access token string when available, or `undefined` if it cannot produce one.
- When a handler returns a token, `ZerodhaService` will set it on its internal credentials and emit a `token:refreshed` event.
- If the handler throws or returns `undefined`, the service emits `token:refresh-required` so external workflows can respond (e.g. by prompting an operator or scheduling a human-driven flow).
- Registering `null` removes/unregisters the handler.

Simple wiring example

1. Create the handler function that knows how to fetch or compute a fresh token.
2. Call `zerodhaService.setRefreshHandler(myHandler)`.
3. Optionally listen for `token:refreshed` and `token:refresh-required` events.

Best practices

- Keep the handler fast and resilient. It is called from internal timers and tests.
- Avoid long-blocking work; prefer an async function that awaits IO.
- Catch and handle errors inside the handler and return `undefined` when refresh isn't possible.
- Do not call network or secret reads directly from tests unless you mock them; prefer wiring test-only handlers during unit tests.

Example (see `backend/examples/refresh-handler.example.ts` for a runnable example using an in-memory token store and a mocked HTTP refresh).

