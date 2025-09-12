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
