# Draft PR: Zerodha adapter hardening

Summary

This draft collects test-friendly hardening changes to the Zerodha WebSocket adapter.

Key changes

- Make reconnect behavior deterministic and testable
  - Handle promise rejections from async `connect()` inside reconnect scheduling
  - Added public helpers: `triggerReconnect()`, `getReconnectAttempts()`, `setReconnectOptions()`, `stopReconnect()`

- Token refresh lifecycle helpers
  - Added `setTokenExpiresAt(msFromNow, scheduleNow)`, `setRefreshBeforeMs(ms)`, and `triggerTokenRefresh()` to allow deterministic unit tests and to make integration with re-auth flows straightforward.

- Subscription helpers
  - Added `setSubscribedTokens(tokens)` and `getSubscribedTokens()` for tests to set/inspect subscriptions without opening real sockets.

- Tests
  - New unit tests under `backend/tests/unit`:
    - `zerodha.reconnect.test.ts`
    - `zerodha.reconnectOptions.test.ts`
    - `zerodha.tokenRefresh.test.ts`
    - `zerodha.subscribe.test.ts`
  - Integration test `zerodha.extra.integration.test.ts` updated to close mock server cleanly in teardown.

Why

- Avoid hitting real Zerodha endpoints in CI and local test runs.
- Make reconnect and token refresh behavior deterministic so CI is reliable.
- Provide low-risk test hooks that don't change production behavior by default.

Notes and next steps

- This branch is intended to be merged only after the related milestone is marked Done per project policy. The repository has a milestone-driven publish script to create draft PRs and to avoid pushing generated artifacts.
- Suggested follow-ups:
  - Auto-resubscribe after reconnect: ensure subscriptions survive reconnects.
  - Pluggable token refresh: allow specifying a callback to handle token refresh (UI or operator flows).
  - Harden parseBinaryTick with additional unit tests for edge cases.

How to test locally

1. From repository root:

```powershell
cd D:/Nanda_AI/GIT_BN_Project/banknifty-signals/backend
npm install
npm test
```

2. Review the unit tests that were added under `backend/tests/unit`.

Requested review

- Please review the public helper names and placement in `ZerodhaService`.
- Confirm if I should prepare a GitHub Draft PR and push this branch, or wait until the milestone is marked Done.
