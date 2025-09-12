Title: feat(ci): add conservative pre-push Husky hook with CI allowlist

Description:
This draft PR introduces a conservative Husky `pre-push` hook that:

- Blocks developer pushes by default to enforce milestone-based, quiet workflows.
- Allows pushes from CI runners (detected via `GITHUB_ACTIONS=true`) so release automation and CI can still push tags/branches.
- Allows explicit developer opt-in via `ALLOW_PUSH=1` or `git config hooks.allowPush true`.
- Runs local checks before allowing a push: `lint`, `npm test` (in `backend`), and `npm run validate:defaults`.

Why:
- Reduce noisy incremental pushes and encourage commit batches aligned with project milestones.
- Preserve CI/release automation behavior so builds and releases continue to work.

Notes:
- The hook is committed only to this feature branch. We'll open a draft PR targeting `develop` so maintainers can review before merging into the shared workflow.
- Local developers can override the hook temporarily with `ALLOW_PUSH=1 git push` or permanently via `git config hooks.allowPush true`.

Verification:
1. Checkout this branch: `git checkout artifact-restore/dist-rules`
2. Try to push a change: it should run lint/tests/validator and block if they fail.
3. Simulate CI: `GITHUB_ACTIONS=true git push` should bypass the hook.

Merge plan:
- Once reviewed and accepted, merge into `develop` (not directly to `main`).
- After a validation period, backport to `main` if desired.
