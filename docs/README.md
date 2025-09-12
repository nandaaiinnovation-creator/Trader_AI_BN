# Project documentation

This `docs/` folder contains project documentation. Key files:

- `RULES.md` — Top-level rulebook (TOC). Points to `docs/rules/part-*.md`.
- `docs/rules/part-1.md` … `part-4.md` — Split rule documents.
- `config/defaults.json` — Example tunable defaults for a few rules.
- `config/defaults.schema.json` — JSON Schema describing allowed tunable keys and simple types (created by the docs script).

How to validate `config/defaults.json`:

```powershell
# from repository root
node ./scripts/validate-defaults.js
```

If validation fails the script will exit non-zero and print errors.
