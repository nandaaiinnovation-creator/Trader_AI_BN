# Status - feature/signal-orchestrator

This file tracks the stabilization work for the `feature/signal-orchestrator` branch.

- Harden E2E test teardown — Completed
  - Added centralized teardown helper and updated integration tests to call it.
- Silence Zerodha parser noise in test env — Completed
  - Parser parse/handle exceptions are logged at debug level when `NODE_ENV === 'test'` or `ZERODHA_SILENCE_PARSE=true`.
- Re-run CI & validate logs — Completed
  - CI run id 17700631533 passed; no worker-process forced-exit warnings observed in logs.
- Audit leaked handles — Deferred
  - Will run `jest --detectOpenHandles` only if the worker warnings reappear in CI or local runs.

Next steps
- Open PR draft to consolidate changes and invite reviewers.
- Consider adding `ZERODHA_SILENCE_PARSE=true` to CI workflow env if we want absolute suppression in non-test job contexts.
- Optionally add buffer-length validation in `parseBinaryTick` if production data shows real parser errors.

Contact
- If stability regressions appear, set `ZERODHA_SILENCE_PARSE=true` or run the integration tests with `--detectOpenHandles` to collect open-handle traces.
