
---
project_name: banknifty-signals
---

# PROJECT_PLAN.md

## 1. Goals & Scope
- Deliver a **production-ready trading workstation** with:
  - Zerodha live integration (BANKNIFTY + NIFTY + top 10 banks).
  - Real-time BUY/SELL signals from 47+ rules and the News Sentiment Analysis **Reference RULES.md or docs/rules part-1.md, part-2.md, part-3.md, part-4.md**
  - Live dashboard with charts, tooltips, and multi-timeframe signals.
  - Backtesting module with visualization & exports.
  - Sentiment integration.
  - Robust persistence (PostgreSQL, Redis).
  - Full observability (Prometheus + Grafana).
  - Local single-user deployment via Docker.

## 2. Architecture
### Frontend
- React + Vite, TailwindCSS + shadcn/ui.
- TradingView lightweight-charts v4.1.0.
- Socket.IO client.
- Pages: Dashboard, Backtesting, Sentiment, Rules Engine, Settings.

### Backend
- Node.js + Express + Socket.IO.
- Modules:
  - Zerodha adapter (REST + WS, OAuth lifecycle).
  - Rules Engine (47 rules, persisted configs).
  - Signal Generator (with feature-flagged Orchestrator).
  - Backtester (walk-forward, grid, Monte Carlo).
  - Sentiment Engine (Webz.io, Tiingo, Alpha Vantage).
- PostgreSQL (Prisma/TypeORM schema + migrations).
- Redis for caching/pubsub.
- Config: `.env` with schema validation.
- Observability: Prometheus `/metrics`, JSON structured logs.

### Database Schema
- `candles`, `signals`, `settings`, `sentiment_daily`, `snapshots`.
- Redis keys for ticks, candles, rules, rate limits, job locks.

## 3. Workflows
- **Live data**: Zerodha WS → backend → rules engine → signals → frontend chart.
- **Backtesting**: Historical candle ingestion → rules engine → metrics → visualization.
- **Sentiment**: Daily fetch → DB persist → optional filter in rules.
- **Export/Import**: Rule configs and backtest results as JSON/CSV.

## 4. Build Stages & Milestones
| Stage | Deliverables |
|-------|--------------|
| Base Infrastructure | Docker stack, Postgres, Redis, migrations, backend healthcheck |
| Zerodha Integration | OAuth, WS adapter, live ticks, test harness, reconnect + token lifecycle |
| Rules Engine | Implement 47 rules, config persistence, per-rule tests |
| Signal Generation | Signal storage, WS broadcast, DB persistence, feature-flagged Orchestrator, post-merge monitoring |
| Frontend Dashboard | Chart, rules panel, tooltips, signal feed |
| Backtesting Module | Modes, metrics, visualization, export |
| Sentiment Module | API fetch, integration, toggle in UI |
| Observability & Tests | Prometheus, structured logging, CI smoke job, integration tests, logger teardown fixes |

## 5. Dependencies
- Zerodha KiteConnect API (REST + WS).
- PostgreSQL 14+.
- Redis 6+.
- Node.js 18+ / React 18+.
- Prometheus + Grafana.

## 6. Risks
| Risk | Mitigation |
|------|------------|
| Zerodha API limits | Rate-limiting, caching, graceful degradation |
| OI data unavailable | Disable OI-dependent rules, show inactive |
| Redis/DB downtime | Graceful shutdown + retries |
| High latency | Local caching, efficient WebSocket handling |
| Rule complexity (47+) | Modular rules, per-rule tests |
| Jest hanging on open handles (pino/WS) | Ensure clean teardown hooks, mock transports in tests |
| Node version drift (18 vs 22) | CI pinned to Node 18, local dev aligned |
| CI flakiness with WS (400 errors) | Add retry/backoff logic, mock WS in integration tests |

## 7. CI/CD & Testing
- Local testing before GitHub push:
  - **Unit tests**: indicators, rules, metrics.
  - **Integration tests**: Zerodha adapter, signal flow.
  - **Smoke tests**: full stack spin-up.
- GitHub Actions pipeline:
  - Lint + tests → Docker build → push to registry → deploy.



## 8. Deployment Checklist
- [ ] Configure `.env` with API keys and DB URLs.
- [ ] Run migrations + seeders.
- [ ] Start full stack via `docker compose up`.
- [ ] Verify backend healthcheck `/health`.
- [ ] Connect Zerodha via Settings page.
- [ ] Verify chart + live signals.

## 9. Design Rationale
- **Dockerized stack** for reproducibility.
- **React + lightweight-charts** for performance.
- **47 modular rules** for flexibility + tuning.
- **PostgreSQL + Redis** for durability and speed.
- **Prometheus/Grafana** for real-time monitoring.
- **Single-user local app** reduces security surface.

## 10. Milestone Policy & Definition of Done

### General Milestone Policy
- Each milestone must be validated before advancing.
- Validation requires:
  - ✅ Code + tests completed locally
  - ✅ CI workflows (unit + integration tests) pass
  - ✅ Documentation updated (`PROJECT_PLAN.md`, `STATUS.md`, PR draft)
  - ✅ Lockfiles committed
  - ✅ TODO/placeholder sweep complete
- Milestones are marked **Done** only when `STATUS.md` reflects completion.

### Definition of Done (per milestone)

- **Base Infrastructure**
  - Docker Compose with Postgres + Redis + backend
  - `/health` endpoint live
  - DB migrations + seeders applied in CI
  - Smoke tests pass in CI
  - STATUS.md updated to Done

- **Zerodha Integration**
  - OAuth lifecycle handled
  - WS adapter stable with reconnect + token refresh
  - Deterministic test harness for WS
  - Unit + integration tests added
  - STATUS.md updated to Done

- **Rules Engine**
  - All 47 rules implemented + config persistence
  - Per-rule unit tests
  - RULES.md + docs updated
  - STATUS.md updated to Done

- **Signal Generation**
  - Signal persistence to DB
  - WS broadcast functional
  - Orchestrator service feature-flagged (`ENABLE_SIGNAL_ORCHESTRATOR=true`)
  - Integration tests for persist+emit
  - Post-merge monitoring complete
  - STATUS.md updated to Done

- **Frontend Dashboard**
  - Charts + rules panel
  - Signal feed live
  - Tooltips functional
  - STATUS.md updated to Done

- **Backtesting Module**
  - Multiple modes (walk-forward, grid, Monte Carlo)
  - Metrics persisted + visualized
  - Export to CSV/JSON supported
  - STATUS.md updated to Done

- **Sentiment Module**
  - API fetch from Webz.io/Tiingo/Alpha Vantage
  - Persisted daily sentiment
  - Toggle in rules panel
  - STATUS.md updated to Done

- **Observability & Tests**
  - Prometheus + Grafana dashboards live
  - Pino structured logs integrated
  - Jest teardown fixes applied (logger/WS handles closed)
  - CI smoke job runs
  - STATUS.md updated to Done

---

## Milestone-driven workflow (enforced)

When advancing a milestone (starting with Base Infrastructure), follow this split of responsibilities and the minimal local-only workflow:

- Local edits (what the agent may create/update):
  - Code, configs, migrations, seeders, scripts, and documentation only.
  - Add/update: `Dockerfile`, `docker-compose.yml`, `/health` endpoint, DB migration files, seeder files, scripts, and `PROJECT_PLAN.md`/`STATUS.md`/`README.md`.
  - Run lightweight checks locally only: `npm run validate:defaults`, `npm test`.
  - Do NOT run `docker compose up` or other container-based commands locally.

- CI responsibilities (GitHub Actions):
  - Full infra validation must run in CI on PRs and manual workflow: `docker compose up`, Postgres + Redis startup checks, `npm run db:migrate`, seeding, healthcheck, and test execution.
  - The CI workflow `infra-validation.yml` is included in the repo and will run on PRs touching infra files.

- Milestone policy:
  - Stay milestone-driven. Continue advancing only the Base Infrastructure milestone until it is fully completed and marked Done in both `PROJECT_PLAN.md` and `STATUS.md`.
  - Push & open Draft PRs for infra/config changes. Small safe fixes may be pushed directly to `main` at owner's discretion, but final merges of milestone branches must be deferred until CI validates the full infra.
  - A milestone is considered Done when:
    1. DB migrations + seeders run successfully in CI.
    2. Healthcheck passes in CI and smoke tests succeed.
    3. `STATUS.md` and `PROJECT_PLAN.md` are updated to reflect Done and documented.

Follow these rules for the Base Infrastructure milestone; after completion, select the next milestone from Section 4 and repeat.

## 11. CI/CD & Milestone publishing (short)

Purpose: provide a small, discoverable description of how CI and milestone publishing works so maintainers can validate readiness before publishing.

- CI policy
  - PRs should run unit tests and linters by default. Integration tests that contact emulated external services should be excluded from PR CI and run via a manual workflow (see `.github/workflows/integration-manual.yml`).
  - The repository includes a lightweight validator for `config/defaults.json` which the CI runs (see `backend/scripts/validate-defaults.js`).

- Milestone publishing policy
  - Milestones are published intentionally: before publishing, the owner must create a marker file `.milestone_done` at repo root (or set `PUBLISH_MILESTONE=1`). This prevents accidental publishes.
  - The `scripts/publish_milestone.js` helper finds the first `PR_DRAFT_*.md` file at the repo root and uses it as the draft PR body when creating the Draft PR via `gh pr create --draft`.
  - `PR_DRAFT_*.md` files are the canonical PR body templates for milestone publishes. Keep at least one `PR_DRAFT_<MILESTONE>.md` in the repo root before publishing.

- Quick publish checklist
  1. Ensure `STATUS.md` reflects readiness and lists the milestone blocking items.
  2. Ensure a `PR_DRAFT_*.md` exists in the repo root with change summary and test results.
  3. Run `npm ci` in `backend` and confirm `backend/package-lock.json` is unchanged or committed.
  4. Run unit tests locally (`npm test`) and optionally `npm run test:integration` for integration harness.
  5. Create `.milestone_done` at repo root and run `npm run publish:milestone` (this will push the current branch and create a Draft PR). Do not run this unless you intend to publish.

Keep `STATUS.md` as the single source of truth for milestone readiness; update it before publishing.