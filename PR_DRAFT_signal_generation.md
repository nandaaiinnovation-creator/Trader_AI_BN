# PR Draft — Signal Generation

Summary

Implement a Signal Orchestrator that takes composite outputs from the Rules Engine, persists signals to the `signals` table, and emits real-time `signal` events via Socket.IO for frontend consumption.

Why this PR

This PR builds directly on the Base Infrastructure and Rules Engine work and unblocks the frontend dashboard and backtesting features by providing a stable signal persistence and broadcast layer.

What changed (high level)

- Added `backend/src/services/signalOrchestrator.ts` — orchestrator service with `persist`, `emit`, and `handle` methods.
- Added `backend/tests/signalOrchestrator.test.ts` — unit tests mocking TypeORM and Socket.IO.
- Minor change to `backend/src/services/rulesEngine.ts` to accept an optional orchestrator and forward generated signals non-blocking.

Acceptance criteria (local checks)

- Unit tests: `npm test` passes locally in `backend`.
- Lightweight validation: `npm run validate:defaults` (if present) remains green.
- No breaking changes to existing APIs or tests.

CI expectations

- PR CI will run unit tests. Full infra validation (docker-compose + migrations + seeders + integration tests) will run on the base infra CI workflow after PR is merged into `main`.

Notes

- The orchestrator is intentionally best-effort and non-blocking so signal generation doesn't block rule evaluation on persistence/emit failures.
- The orchestrator uses `getRepository('signals')` (by entity name) to avoid importing TypeORM-decorated entity classes at module-load time in unit tests.

Manual steps before merging

- Decide if the orchestrator should be wired automatically in app bootstrap (currently opt-in). If yes, update `backend/src/index.ts` to instantiate `SignalOrchestrator` with the Socket.IO `io` instance and pass it to `RulesEngine` instances.

---

Please review and let me know if I should push this branch and open a Draft PR.