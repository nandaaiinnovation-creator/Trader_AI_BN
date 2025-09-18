# Stage 6–8 Milestone PR — Intraday Backtesting Suite, Sentiment, CI Smoke, Ops/Grafana

Resolves: #39

## Summary
Deliver a complete intraday backtesting platform (3m/5m/15m BANKNIFTY) with rule toggles, professional metrics, equity/trade visualization; sentiment connectors + UI; containerized Cypress smoke; and Ops/Grafana polish.

## Acceptance Criteria Mapping
- Backtesting (Intraday Only)
  - Rule toggles: per-rule, per-group (Price Action, Momentum, Trend/MA, Volatility, Sentiment), global
  - Metrics: Win %, Profit Factor, Expectancy, Max DD, Sharpe, PnL
  - Results JSON: overall, per-group, equity curve, trades with rules triggered
  - Live & Demo Modes supported
- Frontend UI
  - Controls panel, summary cards, equity curve, group breakdown, candlestick markers + tooltips, trade table (optional)
- Sentiment
  - Pluggable connectors (rate-limited, cached); UI; optional rules/backtest integration
- CI: Cypress smoke (Demo Mode)
  - Compose up, health wait, specs (WS connect, rules toast, demo backtest summary), artifacts uploaded
- Ops/Grafana
  - Runbook and dashboards updated

## How to Verify (Docker, Windows PowerShell)
See `docs/stage6-8/VERIFICATION.md`.

## Notes
- Keep deterministic demo datasets for 3m/5m/15m to ensure stable CI and local verification.
