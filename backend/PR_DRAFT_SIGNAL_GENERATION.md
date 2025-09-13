# PR Draft - Signal Generation (feature/signal-persist)

Goal

Implement persistence for generated signals and validate end-to-end behavior (DB writes + Socket.IO emits) in CI with real Postgres+Redis.

Changes

- Add `src/services/signalPersist.ts` — TypeORM-backed best-effort persist() called by Signal Orchestrator.
- Add SQL migration `migrations/1680000000000-create-signals-table.sql` that creates the `signals` table.
- Add seed script `scripts/seed-signals.js`.
- Add integration smoke test `tests/integration/signal.persist.integration.test.js` that boots the orchestrator with `ENABLE_PERSIST=true` and asserts a row is present in Postgres.
- Add CI workflow `.github/workflows/infra-validation.yml` which brings up Postgres and Redis services, runs migrations, seeds, builds, and runs the smoke test. This job will run on `main` pushes and on manual dispatch.

Feature flags

- `ENABLE_ORCHESTRATOR` — existing
- `ENABLE_PERSIST` — new; set to `true` to enable DB writes

Acceptance criteria

- Local unit tests pass
- CI `Infra Validation - Signal Persist` job passes on `main` (migrations, seed, smoke test)
- `STATUS.md` updated and this PR opened as Draft for review

Notes

- Persist operation is best-effort and logs errors without crashing the orchestrator loop.
- Tests are plain JS to avoid ts-jest transforms; CI job uses Postgres and Redis services and runs only the smoke test to limit runtime.
