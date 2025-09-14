
---
project_name: banknifty-signals
---

# STATUS.md

## Purpose
Keep a short, up-to-date summary of project progress and the current milestone. Update the **Last Updated** and **% Complete** fields when making progress. This file is used by the milestone publish script and as the single source of truth for milestone readiness.

---

## Project Status

**Summary**: Ongoing development. Core backend and rules engine are implemented. Current work focuses on making the Zerodha adapter CI-safe (test hooks, deterministic integration tests), repo hygiene after a force-push, and CI/publish safeguards.

**Last Updated**: 2025-09-14
**% Complete**: 67%

---

### Phase Tracking (high level)

| Phase | Description | Status |
|-------|-------------|--------|
| Base Infrastructure | Docker, DB, Redis, migrations | ✅ Done |
| Zerodha Integration | OAuth, WS adapter, tokens, test harness | ✅ Done |
| Signal Generation | Composite signals, DB, WS broadcast | ✅ Done |
| Rules Engine | Implement 47 rules, config persistence | ✅ Done |
| Signal Generation | Composite signals, DB, WS broadcast | 🟧 In Progress |
| Frontend Dashboard | Charts, rules panel, signal feed | ⬜ Pending |
| Backtesting | Modes, metrics, visualization | ⬜ Pending |
| Sentiment Module | API connectors, filters | ⬜ Pending |
| Observability & Tests | Prometheus, logging, CI/CD | � In Progress |

---

### Current Zerodha Milestone (what must be present before publishing)

- Zerodha adapter hardening (test hooks, reconnect/backoff, token lifecycle): Done in feature branch `feature/zerodha-hardening` (local).
- Unit tests: Added and passing locally.
- Integration tests (safe, in-process mock `ws`): Added and passing locally; integration tests excluded from PR CI by default and run via manual workflow.
- CI workflows: PR-only unit-test workflow and manual integration runner created.
- Documentation: `backend/docs/zerodha-refresh-handler.md`, `backend/docs/integration-tests.md`, and `backend/examples/refresh-handler.example.ts` added.

### Recent PR update (Signal Orchestrator)

- PR #17 (feature/signal-orchestrator) implements an opt-in `SignalOrchestrator` service, a non-blocking `RulesEngine` hook, and scoped lint fixes. PR-level CI (typecheck + PR workflows) passed and local checks (lint/typecheck/tests) passed. PR remains Draft per project policy.
- The orchestrator is wired into `src/index.ts` behind feature flag `ENABLE_SIGNAL_ORCHESTRATOR=true` and exposed via `src/services/orchestratorSingleton.ts` for optional injection.
- An integration test `tests/integration/orchestrator.integration.test.ts` was added to validate persist+emit behavior with a mocked `io` and `typeorm` repository.

- Wiring orchestrator milestone: In Progress (2025-09-13)

### Reviewer Checklist (mirror of PR template)

- Code Quality & Design: cohesive, SRP, optional integration, descriptive naming, adequate tests.
- Safety & Non-Regression: feature runs disabled by default, handles missing infra, side effects mocked.
- Repo Hygiene: correct directories, imports clean, lint/typecheck/tests pass, no debug artifacts.
- Documentation & Tracking: `STATUS.md` updated, PR describes scope and next steps.

---

### Acceptance Criteria (project-wide)

- Acceptance criteria: `lint` and `typecheck` must pass in CI. Typecheck is a strict gate (`tsc --noEmit`), while lint is allowed to report warnings for legacy issues until the backlog item to tighten linting is completed.

### Tech Debt / Backlog

- Re-enable `--max-warnings=0` in ESLint and fix all legacy lint violations. This is a medium-term effort that should be tracked as a separate milestone.
- Evaluate bumping `engines.node` from `18` → `22` once CI and local environments are aligned. Update CI and `engines` only after verification across the team.

### Node / CI runtime note

- Project runs on Node `18.x` in CI (GitHub Actions workflows are pinned to Node 18). Local Node `22.x` may work but is not guaranteed; developers should prefer Node 18 for parity with CI.

Blocking items before publishing this milestone (per repo policy):

1. Project-level documentation files must reflect new CI/publish flow and how to trigger integrations: `PROJECT_PLAN.md` (reference), `STATUS.md` (this file, updated), and a PR draft file `PR_DRAFT_ZERODHA_LIVE_INTEGRATION.md` must exist (created alongside this update).
2. Ensure lockfile(s) are updated and committed if dependencies changed (`backend/package-lock.json`).
3. Sweep for any remaining `TODO`/`WIP` placeholders and resolve or annotate them.

The branch `feature/zerodha-hardening` MUST remain local and must NOT be pushed until the owner marks the milestone Done.

---

### Base Infrastructure (current focus)

We are advancing the Base Infrastructure milestone. The following items have been added and are in-progress in branch `chore/base-infra-migrations`:

- `docker-compose.yml` for Postgres 14, Redis 6, and the backend
- `/health` endpoint at `GET /health` in `backend/src/index.ts`
- Initial SQL migration at `backend/src/db/migrations/001_init.sql`
- Migration runner at `backend/scripts/run_migrations.js`
- Seeder JSON `backend/src/db/seeders/default_rules.json` and runner `backend/scripts/run_seeders.js`

Milestone policy (short):
- Local edits: create code, migrations, seeders, docs, and run lightweight checks only (`npm run validate:defaults` and `npm test`). Do NOT run `docker compose up` locally.
- CI: infra validation will run `docker compose up`, apply migrations, run seeders, and run tests. See `.github/workflows/infra-validation.yml`.
- A milestone is Done only after CI validates infra (migrations + seed + healthcheck + tests), docs are updated, and `STATUS.md` is marked Done.

---

### Tasks (short checklist)

- [x] Zerodha adapter: test hooks and reconnect hardening (local branch)
- [x] Unit tests added and passing (local)
- [x] Integration tests (mock `ws`) added and passing (local)
- [x] CI: PR unit-tests + manual integration workflow added
- [x] Docs: backend docs and examples added
- [x] Create `PR_DRAFT_ZERODHA_LIVE_INTEGRATION.md` in repo root
- [x] Confirm and commit `backend/package-lock.json` if dependencies changed
- [ ] Final TODO/placeholder sweep
 - [ ] Final TODO/placeholder sweep

---

### Notes

 - Rules Engine milestone: Done. The Rules Engine scaffold, migration, seeders and CI infra-validation were added on branch `feature/rules-engine-scaffold` and verified in CI (infra-validation run id `17710518656` — all tests passed). PR #22 (Rules Engine) and PR #25 (tests) contain the changes. 

 - Follow-ups (open): Issue #23 — "Increase coverage for src/services/rulesEngine.ts" remains open as a tracked improvement that does NOT block milestone progression. Issue URL: https://github.com/nandaaiinnovation-creator/Trader_AI_BN/issues/23

 - New milestone selection: Frontend Dashboard (minimal API wiring + UI placeholders). Rationale: both Rules Engine and Signal Generation are Done; a minimal Frontend Dashboard unblocks reviewers and product testing (it depends on backend APIs that are already present) and enables UX validation and demoing of signals.

### Proposed next milestone: Frontend Dashboard (minimal)

Definition of Done (DoD):
- Create a `feature/frontend-dashboard-minimal` branch with a lightweight Vite+React scaffold in `frontend/`.
- Minimal dashboard page that connects to backend Socket.IO and displays recent signals.
- `README.md` with local run instructions and a dev proxy to backend.
- Open a Pull Request for the scaffold and link the milestone DoD in the PR description.
- Keep Issue #23 (rulesEngine coverage) and Issue #24 (TODO sweep) open as parallel work; do not block this milestone on them.

Priority & scope notes: This is intentionally scoped small — a single-page dashboard that consumes the existing backend API and Socket.IO feed, with a focus on demoability rather than a finished UI. Completing this milestone unblocks Backtesting (by providing a UI to view signals) and Frontend-driven QA.

---

Published milestone PR:

- Draft PR created: https://github.com/nandaaiinnovation-creator/Trader_AI_BN/pull/15 (Zerodha Live Integration)
- Draft PR created: https://github.com/nandaaiinnovation-creator/Trader_AI_BN/pull/15 (Zerodha Live Integration)
- Base Infrastructure PR: https://github.com/nandaaiinnovation-creator/Trader_AI_BN/pull/16 (chore/base-infra-migrations)


---

### Change Log (recent)
- **2025-09-12**: Added deterministic test hooks and hardening to `backend/src/services/zerodha.ts`.
- **2025-09-12**: Added unit and integration tests (mock `ws`); updated `backend/package.json` with integration test scripts.
- **2025-09-12**: Added GitHub Actions workflows: PR-only unit-test CI and manual integration runner.

---

### Notes for reviewers

- This file is intentionally concise. For implementation details see `backend/src/services/zerodha.ts`, `backend/tests/*`, and `backend/docs/*`.
- Per project policy, do not push or create PRs for `feature/zerodha-hardening` until the milestone is explicitly marked Done by the project owner.
