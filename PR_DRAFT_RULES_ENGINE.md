# PR Draft: Rules Engine milestone

Summary

This Draft PR proposes the initial Rules Engine milestone: scaffolding a RulesEngine service, a persisted `RuleConfig` TypeORM entity, and a minimal unit test to validate the scaffold.

Why this milestone

- Builds directly on Zerodha integration and Signal Generation which are Done.
- Enables storing and managing rule configurations which unblock Frontend Dashboard (rules panel), Backtesting (config-driven runs), and Seeders for default rules.
- Low risk: small API surface with no external calls; easy to validate in CI.

Acceptance criteria

- `backend/src/services/rules/index.ts` exports a `RulesEngine` class with registration and evaluate APIs.
- `backend/src/db/entities/ruleConfig.ts` (TypeORM) entity exists with basic fields (id, name, enabled, config JSON, createdAt).
- Unit tests added and pass locally (`backend/tests/unit/rulesEngine.initial.test.ts`).
- `STATUS.md` updated to show Rules Engine is In Progress.
- Draft PR created with this file as body.

Checklist

- [x] Add scaffold `RulesEngine` class
- [x] Add `RuleConfig` TypeORM entity
- [x] Add unit test for scaffold
- [ ] Create DB migration for `rule_configs` (follow-up)
- [ ] Add seeder for default rules (follow-up)

Notes

This Draft PR intentionally keeps changes small and safe. Follow-up PRs will add individual rules, default rule seeders, and migrations.
