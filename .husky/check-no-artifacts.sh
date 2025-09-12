#!/usr/bin/env bash
set -euo pipefail

# Check staged files for backend/dist or backend/coverage
if git diff --cached --name-only | grep -E "^backend/(dist|coverage)(/|$)"; then
  echo "Error: trying to commit generated artifacts under backend/dist or backend/coverage. Remove them from the commit." >&2
  exit 1
fi

exit 0
