module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Use a dedicated tsconfig for ESLint to include test files without
    // modifying the main compiler tsconfig used for builds.
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    jest: true
  },
  rules: {
    // Keep rules permissive for now; fail on errors via --max-warnings=0
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off'
    ,
    // Allow `any` for now - the codebase has many legacy usages. We'll tighten this later.
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow empty catch blocks (used intentionally in some adapters).
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    // Allow @ts-ignore comments for now where unavoidable during refactors.
    '@typescript-eslint/ban-ts-comment': 'off'
  }
};
