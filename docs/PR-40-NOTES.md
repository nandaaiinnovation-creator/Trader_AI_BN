# PR #40 — Stage 6–8: Backtest v2 + Sentiment + Ops

## Summary
This PR finalizes Stage 6–8 as a cohesive milestone:
- Backtest v2: baseline vs adjusted metrics when sentiment is applied; α, factor, score returned
- Frontend Backtesting UI: clearly shows α/factor/score and baseline vs adjusted metrics
- Observability: Prometheus `/metrics` with backtest run counter, duration histogram; `sentiment_score` gauge
- Grafana dashboard panels: p90 backtest duration, run rate by timeframe/sentiment, sentiment score
- Docs: added VERIFICATION.md with Docker-local run steps & troubleshooting
- Tests: backend green (65/65 suites, 78 tests), lint/typecheck pass, frontend build succeeds

## Feature Flags
- `BACKTEST_V2_ENABLED=true`
- `SENTIMENT_ENABLED=true`
- `DEMO_MODE=true` (for smoke/easier WS)

## API and UI Highlights
- `POST /api/backtest/run` supports optional `sentimentInfluence: true`.
  - Response adds `metrics: { baseline, adjusted }` and `sentiment_meta { score, alpha, factor }`.
- Backtesting page renders clear baseline vs adjusted metrics and annotates α/factor/score.
- `GET /api/sentiment/score` feeds `sentiment_score` gauge.

## Metrics
- `/metrics` endpoint exposes:
  - `backtest_runs_total{timeframe,sentiment}`
  - `backtest_duration_seconds{timeframe,sentiment}`
  - `sentiment_score{symbol,timeframe}`
- Prometheus is configured to scrape backend at `/metrics`.
- Grafana dashboard shows:
  - p90 backtest duration (histogram_quantile)
  - backtest run rate by timeframe/sentiment
  - sentiment score time series

## Verification
See docs: `docs/stage6-8/VERIFICATION.md`.

Quick start (Docker):
- Ensure `.env` sets: `BACKTEST_V2_ENABLED=true`, `SENTIMENT_ENABLED=true`, `DEMO_MODE=true`.
- From `docker/`: `docker compose up -d`
- Frontend: http://localhost:3000
- Backend metrics: http://localhost:8080/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## CI
- Existing back/fe CI green
- Containerized smoke runs (Demo Mode + Cypress) — WS & backtest smokes included

## Notes
- Group-by metrics remain baseline-only; adjusted-by-group can be a follow-up.
- Influence model is linear for clarity and determinism.

## Changelog
- feat(backtest): baseline vs adjusted metrics with sentiment
- feat(ops): /metrics, Prometheus + Grafana panels
- feat(ui): annotate α/factor/score; compare baseline vs adjusted
- docs: verification steps; troubleshooting
