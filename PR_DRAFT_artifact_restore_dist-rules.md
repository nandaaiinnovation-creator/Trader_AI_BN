Title: chore(artifacts): restore built dist rule JS files

Description:
This draft PR restores the built JavaScript rule files into an isolated branch for review and debugging. These files come from prior commits and represent the transpiled output used in earlier runs.

Files added (examples):
- `backend/dist/services/rules/*.js` (44 files restored)

Rationale:
Restoring the built artifacts lets maintainers quickly inspect the generated code, reproduce debugging scenarios, or rebuild release artifacts without re-running full local builds in environments with different Node/TypeScript setups.

Verification steps:
1. Checkout this branch: `git checkout artifact-restore/dist-rules`
2. Inspect the restored JS files: `ls backend/dist/services/rules`.
3. Optionally copy selected built files into a local test branch to run smoke tests.
4. Ensure you do not merge these artifacts into `main` — they are intentionally tracked only in review branches.

Notes:
- After review, consider deleting this branch or moving any necessary contents into a controlled release artifact (zip) rather than merging into `main`.
