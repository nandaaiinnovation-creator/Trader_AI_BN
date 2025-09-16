#!/usr/bin/env node
// Small preflight check used in CI to validate key modules are installed after `npm ci`.
// Exits 0 if checks pass, non-zero otherwise. Prints diagnostic info.
const pkg = require('../package.json');
console.log('Preflight check: cwd=', process.cwd());
console.log('Node version:', process.version);
try {
  const archiver = require('archiver');
  console.log('archiver:', require('archiver/package.json').version);
} catch (e) {
  console.error('Missing module: archiver');
  process.exitCode = 2;
}
try {
  const cypress = require('cypress');
  // cypress may not export a version via package.json directly when installed globally; try package.json
  try {
    console.log('cypress:', require('cypress/package.json').version);
  } catch (e) {
    console.log('cypress required (module present)');
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
