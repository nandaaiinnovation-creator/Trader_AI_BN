#!/usr/bin/env node
// Small preflight check used in CI to validate key modules are installed after `npm ci`.
// Exits 0 if checks pass, non-zero otherwise. Prints diagnostic info.
const pkg = require('../package.json');
console.log('Preflight check: cwd=', process.cwd());
console.log('Node version:', process.version);
console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('NPM_CONFIG_PRODUCTION=', process.env.NPM_CONFIG_PRODUCTION);
try {
  const fs = require('fs');
  const nm = 'node_modules';
  if (fs.existsSync(nm)) {
    const entries = fs.readdirSync(nm).slice(0, 40);
    console.log('node_modules entries (first 40):', entries.join(', '));
  } else {
    console.log('node_modules directory not present');
  }
} catch (e) {
  console.warn('Failed to list node_modules:', e && e.message);
}
try {
  // prefer require.resolve to show exact resolution path or error
  try {
    const path = require.resolve('archiver');
    console.log('archiver resolved to:', path);
    console.log('archiver version:', require('archiver/package.json').version);
  } catch (er) {
    console.error('archiver require.resolve failed:', er && er.message);
    throw er;
  }
} catch (e) {
  console.error('Missing module: archiver');
  process.exitCode = 2;
}
try {
  try {
    const path = require.resolve('cypress');
    console.log('cypress resolved to:', path);
    try {
      console.log('cypress version:', require('cypress/package.json').version);
    } catch (e) {
      console.log('cypress module present but version read failed');
    }
  } catch (er) {
    console.error('cypress require.resolve failed:', er && er.message);
    throw er;
  }
} catch (e) {
  console.error('Missing module: cypress');
  process.exitCode = 3;
}
if (process.exitCode && process.exitCode !== 0) {
  console.error('Preflight checks failed. Please ensure `npm ci` completed and devDependencies were installed.');
} else {
  console.log('Preflight checks passed.');
}
process.exit(process.exitCode || 0);
