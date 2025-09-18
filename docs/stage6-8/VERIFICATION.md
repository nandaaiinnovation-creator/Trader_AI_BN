# Stage 6–8 Verification (Docker, Windows PowerShell)

```powershell
Copy-Item .env.example .env -Force
# Demo Mode quick run:
# Set DEMO_MODE=true; ensure BACKTEST_V2_ENABLED=true; SENTIMENT_ENABLED=true (optional)

docker compose -f docker/docker-compose.yml up -d
Start-Process http://localhost:3000
curl http://localhost:8080/api/health
```

Checklist:
- Backtesting: run with grouped toggles respected; metrics populate; equity curve renders; trade markers visible; trade table lists entries
- Sentiment: page renders scores; optional toggle influences backtest
- CI smoke (in GitHub): containerized job builds images, starts stack, runs Cypress smoke (dashboard DOM + nav/settings + backtest smoke), uploads artifacts (container logs, videos, screenshots)
- Ops: runbook instructions valid; Grafana dashboards accessible and useful

Backtest v2 API quick check:
- Ensure env: `BACKTEST_V2_ENABLED=true` and stack is running.
- POST `http://localhost:8080/api/backtest/run` with JSON body:
	`{ "timeframe": "5m", "toggles": { "global": true, "groups": { "Price Action": true, "Momentum": true, "Trend": true, "Volatility": true, "Sentiment": true } } }`
- Expect `data.overall`, `data.groups`, `data.trades` and `data.equity_curve` present. Disabling all groups should return `meta.count=0` and `pnl=0`.

CI Smoke details:
- Workflow: `.github/workflows/ci-smoke.yml` runs on `feature/**` and PRs to `main`.
- Steps: copies `.env.example` to `.env`, enables `DEMO_MODE` and Stage 6–8 flags, builds and `up -d` Docker stack, waits for `http://localhost:8080/api/health` and `http://localhost:3000`, installs Cypress dev deps in `frontend`, and runs three smoke specs.
- Artifacts: uploads `artifacts/*.log` plus `frontend/cypress/videos` and `frontend/cypress/screenshots`.

Local Cypress smoke (optional):
1. Ensure Docker stack is running per instructions above.
2. In `frontend/` install dev deps, then run headless against the containerized app:

```powershell
cd frontend
npm ci --include=dev
npx cypress run --spec "cypress/e2e/dashboard.spec.js,cypress/e2e/nav_and_settings.spec.js,cypress/e2e/backtest_smoke.spec.js" --config baseUrl=http://localhost:3000
```

Troubleshooting:
- Ports: ensure `8080` (backend) and `3000` (frontend) are not in use. On Windows PowerShell, identify listeners:
	```powershell
	netstat -ano | Select-String ":8080|:3000"
	```
	Stop conflicting processes or change mappings if necessary.
- Stale node_modules in Docker: if you see esbuild platform mismatch errors, rebuild images so dependencies are installed inside the container (Linux-native):
	```powershell
	docker compose -f docker/docker-compose.yml build --no-cache
	docker compose -f docker/docker-compose.yml up -d --force-recreate
	```
- Cypress artifacts: after CI, download `ci-smoke-artifacts` to see `backend.log`, `frontend.log`, and any videos/screenshots for failures. Locally, Cypress stores under `frontend/cypress/videos` and `frontend/cypress/screenshots`.
