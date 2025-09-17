---
project_name: banknifty-signals
---

# STATUS.md

## Purpose
Keep a short, up-to-date view of what is truly working end-to-end, by milestone. Update the Last Updated and % Complete fields when functionality crosses a verification threshold (tests or Docker validation).

---

## Project Status (Release Manager View)

Last Updated: 2025-09-17
Overall % Complete (production on localhost via Docker): 80%

Readiness summary: You can bring up Postgres, Redis, Backend, and Frontend in Docker; health checks pass; with valid Zerodha credentials you can complete OAuth, establish a live WebSocket, process ticks, and, with orchestrator enabled, generate/persist/broadcast signals. Frontend dashboard renders and can display live updates. Remaining work is focused on rules/backtest UX wiring, a demo mode for first-run verification without live creds, and a containerized E2E smoke.

---

## Milestone-by-Milestone E2E Status (1–8)

1) Stage 1 — Repo foundation and local dev
• Completed: A user can run a local workstation stack in Docker: Postgres, Redis, Backend, and Frontend containers start cleanly. Backend exposes fast `/health` and `/api/health`. Socket.IO is attached. Frontend serves the built app. Health checks and dependency ordering are in place in the Docker stack under `docker/`.
• In Progress: Documentation emphasizes the `docker/` stack; ensure `.env` alignment for the backend DB URL is consistently documented. The simplified root compose is secondary.
• Pending: None.
• Verifiable in Docker: Start the stack; visit `http://localhost:8080/api/health` (OK) and `http://localhost:3000` (UI loads).

2) Stage 2 — Market data ingestion (Zerodha)
• Completed: OAuth login URL flow, callback handler, secure token persistence (encrypted), and WebSocket ingestion with reconnects/rate-limits. After successful callback and when WS is enabled, ticks stream into the app and are emitted to clients.
• In Progress: Production-like verification requires real API keys configured in `.env` (including a correct redirect URL). Without them, a WS mock can be used to validate the ingestion path.
• Pending: None.
• Verifiable in Docker: Configure `.env` with Zerodha keys; generate login URL from Settings, complete OAuth, observe that the backend reports WS connected and that ticks begin streaming to connected clients.

3) Stage 3 — Rules engine
• Completed: Rules engine is loadable at startup under a feature flag, dynamically registers rule implementations, evaluates inputs, and surfaces pass/fail with scoring and metadata.
• In Progress: The Rules page UI renders; full “edit → persist → take effect” loop via DB-backed configuration is partially wired and not yet validated start-to-finish in containers.
• Pending: Small UX around explaining rules and showing current config values inline.
• Verifiable in Docker: Start with rules enabled; with ticks flowing (real or mock), the engine runs and contributes to downstream signals (visible when orchestrator is enabled).

4) Stage 4 — Signal orchestration and persistence
• Completed: Signals are produced, persisted to Postgres, and broadcast to Socket.IO clients when orchestrator is enabled. Integration tests verify ingest → evaluate → persist → emit.
• In Progress: Prefer the modern orchestrator entrypoint; ensure the feature flag is set in Docker for deterministic behavior.
• Pending: A lightweight status endpoint summarizing orchestrator state would aid ops (optional).
• Verifiable in Docker: Enable orchestrator; with ticks, see new signals in DB and on the WebSocket stream; confirm via logs and client subscription.

5) Stage 5 — REST and WebSocket APIs
• Completed: REST endpoints for health, settings, rules, signals, candles, and backtests exist; Socket.IO emits ticks and signals; CORS is permissive for localhost.
• In Progress: Backtest endpoints exist; full user-triggered runs with visible results in the UI need validation in containers.
• Pending: OpenAPI docs and a simple API console (optional quality-of-life).
• Verifiable in Docker: Health endpoints return OK; broker endpoints produce login URL and accept callback; WS clients receive `tick` and `signal` events.

6) Stage 6 — Frontend dashboard and UX
• Completed: Dashboard, Settings, Rules, Backtesting, and Sentiment pages render. Chart panel shows candlesticks/overlays; timeframe selector works. WebSocket client updates the UI when data streams.
• In Progress: Rules page persistence and Backtesting UI flow exist but need end-to-end validation (trigger, persist, display). Additional E2E coverage beyond navigation is desirable.
• Pending: None for initial visualization; more coverage for complex flows.
• Verifiable in Docker: `http://localhost:3000` shows dashboard; with data streaming, charts/cards update live; Settings can generate the broker login URL.

7) Stage 7 — Testing strategy (unit, integration, E2E)
• Completed: Backend unit/integration tests are comprehensive (including WS jitter/reconnect, persistence, and emissions). Frontend unit/snapshot/a11y tests are green. CI runs backend and frontend suites.
• In Progress: Cypress is used locally; CI doesn’t yet run a containerized Cypress smoke against the compose stack.
• Pending: Containerized E2E gates (spin stack, run 1–2 specs, collect artifacts).
• Verifiable in Docker: Not required; validation is via CI job once added.

8) Stage 8 — CI/CD and operations
• Completed: Multiple CI workflows; frontend CI added (build + Jest). Infra validation jobs spin up DB/Redis, apply migrations/seeds, and run tests. Dockerfiles build production artifacts. Optional Prometheus/Grafana services are available in the Docker stack.
• In Progress: Runbook and “first-run” demo guidance can be clearer.
• Pending: Automated image publishing on release tags (optional) and a containerized E2E smoke job.
• Verifiable in Docker: Start Prometheus/Grafana alongside the app and access metrics/dashboard locally.

---

## Overall Readiness and Verification Guide

Current readiness: 80%

To verify the current stack on Windows PowerShell:

```powershell
# from repo root
Copy-Item .env.example .env -Force
# Edit .env to add ENCRYPTION_KEY (32-byte hex) and Zerodha creds if available

# Start stack (production-like)
docker compose -f docker/docker-compose.yml up -d

# Health checks
curl http://localhost:8080/api/health

# Optional: view UI
Start-Process http://localhost:3000

# Optional: subscribe to WS in browser devtools
#   await io('http://localhost:8080').on('signal', console.log)
```

If you lack live Zerodha credentials, you can still validate API surface, health, UI, and WS connectivity by running with WS disabled or with a local WS mock (to be added in “Demo Mode” below).

---

## Plan to Reach 100% (Production on Localhost)

Priority is given to tasks that (1) build directly on what’s already done and (2) unblock future work.

1) Environment and Compose Alignment (low effort, high leverage)
- Normalize database configuration so backend accepts either a single URL or discrete `POSTGRES_*` variables without manual translation.
- In Docker stack, enable feature flags by default for a demo experience: rules engine and orchestrator on; allow WS toggle.
- Clarify `.env` fields and defaults in README; ensure `ENCRYPTION_KEY` requirement is explicit.
Acceptance: `docker compose up` works out of the box with sample defaults; backend connects to DB/Redis; feature flags behave predictably.

2) Demo Mode for First-Run Validation (unblocks users without live creds)
- Add a small WS mock emitter that can be toggled via `.env` (e.g., DEMO_MODE=true). It produces synthetic ticks and predictable demo signals.
- Seed a small historical dataset so charts populate immediately.
Acceptance: With DEMO_MODE=true and no Zerodha creds, dashboard shows streaming ticks and demo signals within 5 seconds of startup.

3) Rules UI Persistence Loop (connect existing UI to persisted configs)
- Wire the Rules page to load/save rule configurations; apply without restart if supported, or document the apply cycle.
- Display current config values and provide a minimal “apply/rollback” control.
Acceptance: User edits a rule param, saves, and observes expected impact (e.g., rule score) reflected in subsequent signals or a status readback.

4) Backtesting Minimal E2E (one happy path)
- Expose a simple “Run Backtest” on a fixed symbol/timeframe; return a summarized result set and show it in the UI.
- Provide a canned dataset in demo mode for determinism.
Acceptance: From the UI, a user triggers a backtest and sees results (equity curve or summary metrics) without manual steps.

5) Containerized Cypress Smoke (fast safety net)
- Add a CI job that builds the Docker stack, waits for health, runs 1–2 Cypress specs (navigate to dashboard, confirm an event over WS/mock), and uploads artifacts.
Acceptance: PRs get a green/red signal from the smoke job in under ~6–8 minutes.

6) Ops Runbook and Troubleshooting
- Add a concise runbook: ports, logs, how to reset volumes, verifying WS, and common fixes (e.g., “pg_isready failing”).
Acceptance: New users can self-serve to green in <15 minutes with either live creds or demo mode.

---

## Agent Update Protocol (How to Keep % Accurate)

When to update the Overall % Complete:
- +5–10%: A milestone’s “Verifiable in Docker” steps are reproducible on a fresh machine with documented commands.
- +5%: A new CI gate (e.g., containerized Cypress smoke) passes on `main` consistently over 3 consecutive merges.
- +2–3%: A UX flow becomes fully persistent and user-visible (e.g., Rules edit-save-apply loop verified in Docker).

How to update:
- Edit this file’s “Last Updated” and “Overall % Complete,” and mark the relevant stage bullets with stronger language (from In Progress → Completed) only after you’ve either:
	- run the Docker verification commands locally, or
	- seen the new CI job pass on `main`.
- Keep notes brief and functional (what the user can do now), avoid file listings.

Evidence to collect (optional but encouraged):
- Screenshots of the dashboard with live or demo ticks.
- Short log excerpts showing signals persisted and emitted.
- CI run URLs for the first green of any new gate.

---

## Next Steps (Low Blockers, High Impact)

1) Compose/Env normalization
- Make the backend accept discrete DB vars or compute `POSTGRES_URL` automatically; set defaults in `.env.example`.

2) Enable feature flags by default in Docker stack
- Turn on rules engine and orchestrator in the compose environment, with a clear toggle to disable.

3) Add Demo Mode (WS mock + seed data)
- Provide a small in-process tick emitter and minimal seed so first-run users see live charts/signals without real credentials.

4) Rules UI persistence pathway
- Connect existing Rules page to the save/load endpoints and confirm changes impact the engine at runtime (or after a quick apply cycle).

5) Containerized Cypress smoke in CI
- Stand up a short job that brings the stack up, runs 1–2 specs, and tears down; gate PRs.

These steps build directly on what’s already working and unblock future work (backtesting UX, richer CI, and smoother onboarding) with minimal risk.

---

## Change Log (recent highlights)
• 2025-09-17: Frontend CI (build + Jest) added on push/PR. Dashboard and Settings verified via unit/E2E locally. Docker stack validated for health and UI load.
• 2025-09-15: Orchestrator feature-flag wiring stabilized; rules engine optional load verified.
• 2025-09-14: Zerodha OAuth flow, token persistence, and WS ingestion verified with mock and live configuration paths.

---

Notes for reviewers: This file focuses on functional outcomes and Docker verifiability. For deeper implementation details, consult repository docs and tests. Avoid renaming this file; it is the single source of truth for milestone readiness.
