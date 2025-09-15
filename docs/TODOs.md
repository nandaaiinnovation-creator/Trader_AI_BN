# Project TODOs (automatically generated)

This file lists deferred or tracked TODOs found during the sweep (Issue #24).

1. Increase RulesEngine coverage (Issue #23)
   - Add focused unit tests for `rulesEngine.evaluate()` branches.
   - Mock orchestrator/redis where required.
   - Priority: High (tests help validate safety of rule changes).

2. Re-enable stricter ESLint gating
   - Consider re-enabling `--max-warnings=0` in CI after backlog fixes.
   - Track as medium-term effort.

3. Verify lockfiles
   - Confirm `backend/package-lock.json` is committed and unchanged after any dependency changes.

4. PR Drafts & Milestone publishing
   - Confirm `PR_DRAFT_ZERODHA_LIVE_INTEGRATION.md` is current before publishing.

Notes:
- Small doc fixes (typos, duplicate checklist lines) were fixed in `STATUS.md`, `PROJECT_PLAN.md`, and `PR_BODY.md`.
- No code-level TODOs were found in `src` or `tests` during the sweep.

Action plan:
- Convert larger items (1 & 2) into tracked GitHub Issues if desired by the maintainers.
- Mark this file as the single place to add deferred TODOs until they're converted to Issues.
