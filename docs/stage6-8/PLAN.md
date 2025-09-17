# Stage 6–8 Milestone Plan

This document scopes the final milestone to reach localhost production readiness.

Scope (delivered together in a single PR):
- Intraday backtesting suite (BANKNIFTY 3m/5m/15m) with rule toggles (per-rule, per-group, global)
- Performance metrics: Win %, Profit Factor, Expectancy, Max Drawdown, Sharpe, PnL
- Results JSON: overall, per-group, equity curve, detailed trades (time, entry/exit, PnL, rules triggered)
- Backtesting UI: controls panel, summary cards, equity curve chart, group breakdown, candlestick markers + tooltips, optional trade table
- Sentiment connectors + UI: pluggable, rate-limited, cached; optional integration with rules/backtests
- CI: containerized Cypress smoke (Demo Mode)
- Ops/Grafana polish + runbook

Non-goals:
- Non-intraday backtesting (daily/weekly)
- Distributed compute scheduling

Delivery mechanics:
- One milestone PR only; no partials on main. Acceptance mapping + Docker verification steps included.
