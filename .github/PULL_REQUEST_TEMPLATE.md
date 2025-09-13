## Summary
<!-- Describe the change and why it's necessary. -->

## Acceptance checklist (Author)
- [ ] Tests: unit tests added/updated and passing in CI
- [ ] Typecheck: TypeScript typecheck passes in CI (`tsc --noEmit`)
- [ ] Lint: ESLint runs in CI (warnings allowed for legacy code; new code should be lint-clean)
- [ ] Documentation: relevant docs updated (if needed)

## Implementation notes
<!-- Add any important implementation details or trade-offs. -->

## Testing instructions
<!-- How to run tests and any manual verification steps. -->

---

## Reviewer Checklist

### Code Quality & Design
- [ ] Code is cohesive and follows single-responsibility
- [ ] Integration is optional/non-breaking where applicable
- [ ] Naming is consistent and descriptive
- [ ] Adequate test coverage (including edge cases)

### Safety & Non-Regression
- [ ] Application runs correctly with new feature disabled
- [ ] Existing rules/tests unaffected
- [ ] Handles missing dependencies gracefully (e.g. db/socket)
- [ ] Side effects mocked in tests

### Repository Hygiene
- [ ] Files placed in correct directories
- [ ] Imports clean (no circular deps, no unused code)
- [ ] Lint, typecheck, and tests pass
- [ ] No stray debug logs or artifacts

### Documentation & Progress Tracking
- [ ] `STATUS.md` updated for milestone
- [ ] `PROJECT_PLAN.md` consistent with current progress
- [ ] Feature/role explained in PR description or comments

### Next Step Alignment
- [ ] PR description clearly states scope (included vs deferred work)
- [ ] Next steps are clear/unblocked
- [ ] Risk of merging is low

---

## Reviewer Summary
- Items completed / in good shape  
- Items needing improvement  
- Next logical steps  
