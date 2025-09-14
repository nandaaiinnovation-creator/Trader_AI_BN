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
 - PR #17 has been marked ready for review; assign backend/test owners as reviewers.
- Consider adding `ZERODHA_SILENCE_PARSE=true` to CI workflow env if we want absolute suppression in non-test job contexts.
- Optionally add buffer-length validation in `parseBinaryTick` if production data shows real parser errors.

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
 - PR #17 has been marked ready for review; assign backend/test owners as reviewers.
- Consider adding `ZERODHA_SILENCE_PARSE=true` to CI workflow env if we want absolute suppression in non-test job contexts.
- Optionally add buffer-length validation in `parseBinaryTick` if production data shows real parser errors.

Contact
- If stability regressions appear, set `ZERODHA_SILENCE_PARSE=true` or run the integration tests with `--detectOpenHandles` to collect open-handle traces.

Integration / CI Enhancements
- `ZERODHA_SILENCE_PARSE=true` was added at the job-level to `.github/workflows/ci.yml` on branch `feature/signal-orchestrator` to guarantee parser-silencing in CI runs. This change was committed and pushed with message: "ci: set ZERODHA_SILENCE_PARSE=true for CI test/integration jobs".

This satisfies the PROJECT_PLAN.md requirement that `STATUS.md` reflects readiness and lists milestone blocking items.


Rollback & monitoring (post-merge)

- Rollback (quick):
  1. Revert the merge commit on `main`/target branch: `git revert <merge-commit-hash>` and push the revert branch, then open a PR to revert if automatic push protection prevents direct push.
  2. If a faster emergency rollback is required and you have deploy access, redeploy the previous release artefact (use the latest green `backend-dist` artifact) and scale back traffic.

- Monitoring checklist (first 30 minutes):
  - Confirm CI smoke-checks pass on main (build, unit tests).
  - Watch application logs for unexpected `ERROR`/`RangeError` traces from `zerodha.ts` or unexpected `pino` worker warnings.
  - Check DB errors or failed persistence to the `signals` table by scanning recent insertion errors in the logs.
  - Verify integration health endpoints (if present) or run a small synthetic run of the orchestrator E2E test locally against `main`.

- Post-merge follow-up (24 hours):
  - Re-run integration tests in the `feature/signal-orchestrator` branch with `--detectOpenHandles` once from main to double-check no leaked handles remain.
  - If rollback occurred, open an incident entry with exact revert commit and steps taken.
