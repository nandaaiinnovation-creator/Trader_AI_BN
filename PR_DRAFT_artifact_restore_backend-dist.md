Title: chore(artifacts): restore backend-dist.zip and coverage

Description:
This draft PR intentionally restores two artifact files from the previously archived `restore-artifacts` branch into a feature branch for inspection:

- `backend-dist.zip` — a zipped distribution of the backend build
- `backend/coverage/lcov.info` — coverage metadata for the backend test run

Rationale:
We preserved these artifacts in a temporary archive branch during repository cleanup. This PR provides an auditable and isolated place to review the artifacts, download `backend-dist.zip` for local inspection, or re-add specific build artifacts if required for debugging or release reconstruction.

Files changed:
- `backend-dist.zip` (added)
- `backend/coverage/lcov.info` (added)

Verification steps:
1. Checkout this branch: `git checkout artifact-restore/backend-dist`
2. Verify files exist: `ls backend-dist.zip` and `ls backend/coverage/lcov.info`
3. Download and inspect the zip: `tar -tf backend-dist.zip` or use Explorer on Windows
4. Run any CI or local checks you prefer; note that CI may warn about added artifacts but this branch is isolated and intended for review.

Notes:
- These files are intentionally ignored in `main` via `.gitignore` and CI guards; do not merge these artifacts into `main` unless you intentionally want to reintroduce them.
- After review, consider deleting this branch to avoid future accidental merges.
