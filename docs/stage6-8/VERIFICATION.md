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
- CI smoke (in GitHub): job spins stack, runs specs (WS connect, rules toast, demo backtest summary), uploads artifacts
- Ops: runbook instructions valid; Grafana dashboards accessible and useful

Backtest v2 API quick check:
- Ensure env: `BACKTEST_V2_ENABLED=true` and stack is running.
- POST `http://localhost:8080/api/backtest/run` with JSON body:
	`{ "timeframe": "5m", "toggles": { "global": true, "groups": { "Price Action": true, "Momentum": true, "Trend": true, "Volatility": true, "Sentiment": true } } }`
- Expect `data.overall`, `data.groups`, `data.trades` and `data.equity_curve` present. Disabling all groups should return `meta.count=0` and `pnl=0`.
