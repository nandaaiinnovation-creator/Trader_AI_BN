
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
  - Signal Generator.
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
| Stage | Deliverables
|-------|--------------|--------|
| Base Infrastructure | Docker stack, Postgres, Redis, migrations, backend healthcheck
| Zerodha Integration | OAuth, WS adapter, live ticks 
| Rules Engine | Implement 47 rules, config persistence
| Signal Generation | Signal storage, WS broadcast, DB persistence
| Frontend Dashboard | Chart, rules panel, tooltips, signal feed
| Backtesting Module | Modes, metrics, visualization, export
| Sentiment Module | API fetch, integration, toggle in UI
| Observability & Tests | Prometheus, logging, CI/CD, integration tests

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

