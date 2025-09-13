CI workflow editing guidelines
=============================

Purpose
-------
This short document lists a few lightweight dos and don'ts to avoid malformed workflow files that can create empty/failed runs.

Dos
---
- Keep each workflow file as a single YAML document (no duplicated top-level `name` / `on` / `jobs` keys).
- Validate workflow YAML before pushing (we include a `workflow-lint` job that will run on PRs and feature branches).
- Prefer `workflow_dispatch` during edits so you can manually trigger a run for verification.
- Run `yamllint` locally (or use VS Code YAML extension) before committing.

Don'ts
------
- Do not paste multiple workflow definitions into a single file. If you need multiple workflows, create separate files under `.github/workflows/`.
- Avoid inline editing that results in duplicate `on:` or `jobs:` blocks.

What this repo does for you
--------------------------
- A lightweight `workflow-lint` job runs on PRs and feature pushes and will fail the PR if any `.github/workflows/*.yml` fails `yamllint` checks.

Follow-up
---------
If you want stricter validation (e.g., schema checks against Actions workflow JSON schema), I can add a job that runs `actions/workflow-usage` or a similar linter in a follow-up change.
