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
