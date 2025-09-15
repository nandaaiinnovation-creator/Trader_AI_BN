# Draft PR: Zerodha Live Integration - Hardening & Safe Tests

This is a draft PR description for the Zerodha Live Integration milestone (hardening, test hooks, safe integration tests). Do NOT push the `feature/zerodha-hardening` branch until the milestone is marked Done.

Summary

This change set hardens the Zerodha WebSocket adapter and adds deterministic, CI-safe tests that never contact live Zerodha. It also adds CI safeguards to keep integration tests out of PR runs.

What changed

- Zerodha adapter (`backend/src/services/zerodha.ts`):
  - Deterministic reconnect helpers and options (`triggerReconnect`, `setReconnectOptions`, `getReconnectAttempts`, `stopReconnect`).
  - Token lifecycle helpers: `setTokenExpiresAt`, `triggerTokenRefresh`, `setRefreshBeforeMs`, and `setRefreshHandler` (pluggable refresh callback).
  - Subscription helpers: `setSubscribedTokens`, `getSubscribedTokens`, and auto-resubscribe controls.
  - Rate-limit tracking to avoid aggressive subscribe loops in tests/edge states.
  - `cleanupAsync()` for clean shutdown (timers and sockets).
  - Hardened parsing of binary ticks to avoid test failures on malformed packets.

- Tests:
  - Unit tests for reconnect, token refresh, and subscription logic added under `backend/tests/unit`.
  - Integration tests use an in-process `ws` mock server to emulate Zerodha and are added under `backend/tests/integration`.
  - Jitter integration test made deterministic by explicit subscribe ACKs from the mock server.

- CI & scripts:
  - `backend/package.json`: added `test:integration` and `test:integration:debug` scripts.
  - `.github/workflows/ci.yml`: runs unit-tests (integration tests are excluded from PR CI).
  - `.github/workflows/integration-manual.yml`: manual workflow to run integration tests via `workflow_dispatch`.

- Docs & examples:
  - `backend/docs/zerodha-refresh-handler.md` (usage of `setRefreshHandler`).
  - `backend/docs/integration-tests.md` (how to run integration tests and scripts).
  - `backend/examples/refresh-handler.example.ts` (example wiring for refresh handler).

Tests & Validation

- Local test run (full): `Test Suites: 55 passed, 55 total; Tests: 60 passed, 60 total`.
- Integration-only: `Test Suites: 3 passed, 3 total; Tests: 4 passed, 4 total`.
- Unit + integration tests close network resources and call `cleanupAsync()` to avoid open handles.

Checklist before publishing (must be completed before pushing branch)

- [ ] Update project-level docs to reference CI/publish flow and manual integration runner: `PROJECT_PLAN.md` (reference), `STATUS.md` (updated), and create this PR draft file.
- [ ] Verify and commit `backend/package-lock.json` if dependencies changed.
- [ ] Sweep repository for remaining `TODO`/`WIP` placeholders and address or annotate them. (IN-PROGRESS: agent scanning and resolving small items)

Notes

- The `feature/zerodha-hardening` branch remains local and should NOT be pushed or opened as a PR until the milestone is Approved/Done.
- The repository includes a `scripts/publish_milestone.js` helper which looks for the first `PR_DRAFT_*.md` file at repo root to create the Draft PR automatically when you're ready.

Requested reviewers

- Backend owner: please review the helper names and ensure the API is acceptable.
- CI owner: review workflows to confirm integration tests are manual-only.
- QA: run `npm run test:integration` locally to validate the integration harness.
