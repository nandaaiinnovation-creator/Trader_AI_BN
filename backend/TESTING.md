Testing notes

Current fast workflow
- Tests are written to require compiled JS in `dist/` so Jest runs without TypeScript transforms.
- Run:

```powershell
npm run build
npm test
```

Switch to TypeScript tests (optional)
- Install ts-jest locally:

```powershell
npm install --save-dev ts-jest
```

- Then run TypeScript tests using the provided npm script (this uses `jest.config.cjs`):

```powershell
npm run test:ts
```

Notes
- `test:js` runs the existing JS tests only.
- If you prefer writing tests in TypeScript, convert test files to `.ts` and ensure `dist` is built when tests expect compiled modules, or update tests to import `src` and let ts-jest handle compilation.
