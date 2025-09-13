Contributing
============

Thanks for contributing! This file contains a short note about editing GitHub Actions workflow files safely.

Workflow editing basics
-----------------------
- Keep each workflow file as a single YAML document. Do not paste multiple workflow definitions into a single file.
- Avoid duplicating top-level keys like `name:`, `on:`, or `jobs:` within the same file.
- When updating workflows, prefer to add `workflow_dispatch` so you can manually trigger a run for verification.

Automated safeguards in this repository
--------------------------------------
- There is a `Workflow Lint` job that runs on PRs and `feature/**` pushes: `.github/workflows/workflow-lint.yml`. It runs `yamllint` against `.github/workflows/*.yml` and will fail the PR if any workflow YAML is invalid.
- We also include a `ci-workflow-guidelines.md` under `.github/workflows/` with quick dos/don'ts.

If you want stricter checks
--------------------------
If you prefer stricter validation (schema validation against Actions workflow schema), we also run an `actionlint`-based job (see `.github/workflows/workflow-schema-lint.yml`), which performs a schema + best-practice check of workflow files. If you'd like this tightened further, open a PR and I can help tune it.
# Contributing

Thanks for contributing! A few guidelines to keep the repo clean and make branch switching painless.

## Don't commit generated artifacts

The following directories are generated during build/test and should not be committed:

- `backend/dist/`
- `backend/coverage/`

We've added `.gitignore` entries for these, so normal workflows won't add them. If you see these files locally, they were likely created by running tests or a build.

## Safe local workflow

Stash uncommitted changes (including untracked generated files):

```powershell
# Save everything (including untracked files)
git stash push -u -m "WIP: save artifacts before switching"

# Switch branches safely
git checkout main
git pull origin main
```

Create a branch from the stash (if you want to preserve artifacts in a branch):

```powershell
# Create a new branch and apply the stash
git stash branch backup-artifacts stash@{0}
```

If you don't need the saved stash, drop it:

```powershell
# List stashes
git stash list

# Drop the stash at index 0
git stash drop stash@{0}
```

Cleaning generated artifacts

```powershell
# WARNING: this deletes untracked files. Use with caution.
# Clean all untracked files and directories
git clean -fdx
```

## CI notes

- The CI workflow runs tests from `./backend` and runs the defaults validator (`npm run validate:defaults`) inside that folder.
- Do not rely on committing `backend/dist` or `backend/coverage` to preserve build outputs — use release artifacts instead.

## Questions or changes

If you'd like stricter checks (e.g., CI failure when `backend/dist` is present in commit), open an issue and we can add a pre-commit or CI gate.
