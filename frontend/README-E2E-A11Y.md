# E2E and Accessibility (local)

This project includes a minimal Cypress e2e scaffold and a jest-axe accessibility smoke test.

Install deps (run from `frontend`):

```powershell
npm install
```

Run unit tests:

```powershell
npm test
```

Run Cypress (dev):

```powershell
npm run dev
# in another terminal
npm run e2e
```

Run accessibility smoke test (requires jest-axe):

```powershell
npm run a11y
```

Notes:
- `jest-axe` and `cypress` are added to `devDependencies` in `package.json`. Install them locally before running E2E/a11y.
- The a11y test is guarded and will be skipped when `jest-axe` is not installed.
