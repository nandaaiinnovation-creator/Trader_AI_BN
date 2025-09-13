# BankNifty Signals — Repository README

<!-- CI status badge -->
[![CI](https://github.com/nandaaiinnovation-creator/Trader_AI_BN/actions/workflows/ci.yml/badge.svg)](https://github.com/nandaaiinnovation-creator/Trader_AI_BN/actions/workflows/ci.yml)

This repository contains the backend and frontend for a BankNifty trading signals workstation. The repo uses a milestone-driven workflow: milestones are advanced by creating code/config/docs changes, validating lightweight checks locally, and letting CI perform full infra validation.

Local developer workflow (allowed):

- Make code/config/docs changes for the current milestone.
- Run lightweight checks locally:
  - `cd backend`
  - `npm ci`
  - `npm run validate:defaults`
  - `npm test`
- Do NOT run `docker compose up` or spin up Postgres/Redis containers locally as part of milestone work — CI will run those steps to validate infra.

CI responsibility (GitHub Actions):

- The CI workflow `infra-validation.yml` runs on PRs touching infra and will:
  - Spin up Postgres and Redis containers
  - Run `npm run db:migrate` (applies SQL migrations)
  - Run seeders
  - Execute tests and smoke healthchecks

Milestone publishing policy:

- A milestone is considered Done only when CI successfully validates infra (migrations + seed + healthcheck + tests) and `STATUS.md` and `PROJECT_PLAN.md` are updated to mark Done.
- Create a Draft PR for milestone branches and wait for CI to pass before merging.

If you have any questions about running or extending the CI infra validation, open an issue or a PR describing the change.
# Trader_AI_BN — BANKNIFTY signals

## Owner
- Primary Owner: Nanda Kishore Gade  

This repository contains the BANKNIFTY trading rules engine and backend. The project uses TypeScript, Jest (ts-jest) for tests, and GitHub Actions for CI.

**banknifty-signals** is a full-stack trading workstation for **BANKNIFTY** and related indices.  
It connects directly to **Zerodha KiteTicker**, applies a **47+ rule engine** (trend, momentum, volume, OI, sentiment), and produces real-time BUY/SELL signals on multiple timeframes.  
It supports **live charts, backtesting, optional sentiment integration, and persistent storage** via PostgreSQL and Redis, fully containerized with Docker.

Quick start (PowerShell)

1. Install dependencies

```powershell
Set-Location D:\Nanda_AI\GIT_BN_Project\banknifty-signals\backend
npm ci
```

2. Build

```powershell
npm run build
```

3. Run tests

```powershell
npm run test:ts -- --runInBand
```

CI
- A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR and daily to build and run tests. It also uploads `backend/dist` and `backend/coverage` as workflow artifacts.

Releases
- When you publish a GitHub Release (or create a tag and publish), the release workflow will build the project and attach a zipped `backend/dist` as a release asset.

Notes
- `dist/` and `coverage/` are intentionally not tracked in Git. If you need to preserve build artifacts, use the GitHub Actions release artifacts or add an explicit release.
- If you have local generated `dist` or `coverage` directories, keep backups before switching branches as they may block checkout.
# BankNifty Signals Workstation

## Overview
A full-featured, production-ready trading workstation for BANKNIFTY, NIFTY, and 10 BankNifty components, powered by Zerodha KiteConnect and KiteTicker. Features:
- Real-time signals from a 47-rule engine
- Candlestick charts (TradingView lightweight-charts v4.1.0)
- Backtesting, sentiment integration
- PostgreSQL + Redis
- Containerized with Docker Compose
- Single-user, local workstation

## Key Features
- **Real-time signals** from 47+ configurable rules.
- **Dashboard** with candlestick charts (TradingView lightweight-charts).
- **Multi-timeframe aggregation**: 1m, 3m, 5m, 15m.
- **Rule explanations** with tooltips + per-rule scoring.
- **Backtesting** with multiple modes (single, grid, Monte Carlo).
- **Sentiment integration** (Webz.io, Tiingo, Alpha Vantage).
- **Full persistence** with PostgreSQL & Redis.
- **Containerized**: One command to spin up full stack with Docker.

git clone https://github.com/nandaaiinnovation-creator/Trader_AI_BN.git
cd banknifty-signals

##Instructions

- **Always read this README.md first** for the latest context.  
- `PROJECT_PLAN.md` and `RULES.md` define the *fixed scope, architecture, and constraints*.  
- `STATUS.md` is a **dynamic progress tracker**:
  - It can be updated automatically by the contributors.
  - It should always reflect the most recent project state (% complete, blockers, tasks).
  - Treat it as disposable/overwritable since README.md holds the authoritative context.
- Update workflow:
  1. Read README.md → check PROJECT_PLAN.md + RULES.md → then update STATUS.md.
  2. Append updates in STATUS.md rather than editing history in README.md.

## Quick Start
1. Copy `.env.example` to `.env` and fill in your Zerodha API keys and secrets.
2. Run:
   ```sh
   docker compose up -d
   ```
3. Open `http://localhost:3000` in your browser.
4. Click "Generate Login URL" in the app, log into Zerodha, and see live BANKNIFTY ticks & signals.

## Token Flow
- Click "Generate Login URL" in Settings.
- Complete Zerodha login; you will be redirected to the callback URL.
- Access token is securely stored (AES-GCM) and session managed automatically.
- If token expires, UI prompts for re-authentication; app remains usable for backtests/paper trading.

## Troubleshooting
- Ensure all containers are healthy (`docker compose ps`).
- If DB migrations fail, run `make db-migrate` and `make db-seed`.
- For logs: `make logs` or `docker compose logs backend`.
- For development: `make dev` (hot reload, mounted volumes).

## Security
- Secrets encrypted at rest (AES-GCM)
- Strict CORS disabled by default (local only)
- Input validation and rate-limiting on all APIs
- Secrets masked in UI; never printed in logs

## Observability
- Prometheus metrics at `/metrics`
- Optional Grafana dashboard at `http://localhost:3001`

## Full Documentation
See inline code comments and API docs for details on endpoints, rules, and configuration.

## Validate defaults

We keep example tunables in `config/defaults.json` and a JSON Schema in `config/defaults.schema.json`.

To validate the defaults locally (recommended):

PowerShell commands (run from the repo root `banknifty-signals`):

```powershell
Set-Location D:\Nanda_AI\GIT_BN_Project\banknifty-signals\backend
npm ci
npm run validate:defaults
```

CI note: the repository CI will run the same validator as part of the `build-and-test` job (it runs `npm ci` in `./backend` then `npm run validate:defaults`).

If validation fails, schema errors will be printed; fix `config/defaults.json` accordingly and re-run the validator.

## License
MIT

## Developer tooling note

Decision: the JSON Schema validator (`ajv`) is intentionally kept in `backend/devDependencies` because the validator script `backend/scripts/validate-defaults.js` is backend-scoped and CI runs it from the `backend` directory. Keeping the dependency local to `backend` makes installs lighter for contributors who only work on docs or other top-level parts of the repo.

If you'd like to centralize dev tooling (move `ajv` to the repo root), open an issue or PR; I'll help migrate CI and scripts accordingly.

## Milestone publish workflow

We follow a quiet, milestone-driven publish process to avoid noisy incremental pushes and keep history clean.

- To mark a milestone as ready for publish, create an empty file at the repo root named `.milestone_done` or set `PUBLISH_MILESTONE=1` in your environment.
- To publish the current branch and create a draft PR (uses `gh` GitHub CLI):

```powershell
# one-time: ensure dependencies are installed
npm ci

# run local checks (lint/tests/validate)
npm run lint
cd backend; npm test; npm run validate:defaults; cd -

# create .milestone_done (or set PUBLISH_MILESTONE=1)
New-Item -Path . -Name .milestone_done -ItemType File

# run the publish script (creates a draft PR targeting 'develop')
npm run publish:milestone
```

Notes:
- The script will push the branch (bypassing pre-push hook temporarily) and create a draft PR using `gh pr create --draft` with the first `PR_DRAFT_*.md` file as the PR body.
- The script requires `gh` to be installed and authenticated. It is intentionally conservative: it refuses to run unless `.milestone_done` exists or `PUBLISH_MILESTONE=1` is set. This prevents accidental publishes.

