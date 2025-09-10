# Trader_AI_BN — BANKNIFTY signals backend

This repository contains the BANKNIFTY trading rules engine and backend. The project uses TypeScript, Jest (ts-jest) for tests, and GitHub Actions for CI.

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
- Real-time signals from a 32-rule engine
- Candlestick charts (TradingView lightweight-charts v4.1.0)
- Backtesting, paper trading, sentiment integration
- PostgreSQL + Redis
- Containerized with Docker Compose
- Single-user, local workstation

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

## License
MIT
