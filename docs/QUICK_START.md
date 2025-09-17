# Quick Start

This guide helps you bring up the full stack locally (Docker) and verify the milestone features, including Demo Mode.

## Prerequisites
- Docker Desktop
- Node.js 18.x for local builds (optional)

## Setup
1. From repo root:
   - Copy the env template and adjust as needed
   ```powershell
   Copy-Item .env.example .env -Force
   ```
   - Ensure `ENCRYPTION_KEY` is set (32-byte hex). If using Demo Mode without broker creds, set `DEMO_MODE=true` in the `.env` used by backend service.

2. Start the stack:
   ```powershell
   docker compose -f docker/docker-compose.yml up -d
   ```

3. Health checks:
   ```powershell
   curl http://localhost:8080/api/health
   ```

4. Open the UI:
   ```powershell
   Start-Process http://localhost:3000
   ```

## Demo Mode (no broker creds)
- Set `DEMO_MODE=true` for the backend service environment in `docker/docker-compose.yml` or your `.env`.
- In Demo Mode, synthetic ticks and example signals are emitted to Socket.IO; charts and cards update within a few seconds.

## Verify features
- Rules UI:
  - Go to `/rules`, toggle a rule, and click Save. A green toast confirms apply; the Dashboard Rules panel updates live.
- Backtesting:
  - Go to `/backtesting`, click "Run Demo Backtest"; a deterministic summary card appears.
- Dashboard:
  - Observe session timer, connection status, HTF confluence badge, ATR/VWAP deviation (approx), breadth metric, and 3m/5m/15m SignalCards.
  - The recent signals list appends in real-time; click "Load older" to fetch more history.

## Troubleshooting
- If the frontend cannot reach the backend, confirm ports 3000 (frontend) and 8080 (backend) are open and not used by other processes.
- If DB/Redis containers aren’t healthy, run `docker compose ps` and inspect logs: `docker compose logs backend`.
- For live broker verification, set the Zerodha env variables and ensure redirect URLs match configuration.
