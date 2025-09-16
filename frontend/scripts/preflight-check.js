#!/usr/bin/env node
// Small preflight check used in CI to validate key modules are installed after `npm ci`.
// Exits 0 if checks pass, non-zero otherwise. Prints diagnostic info.
const pkg = require('../package.json');
console.log('Preflight check: cwd=', process.cwd());
console.log('Node version:', process.version);
console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('NPM_CONFIG_PRODUCTION=', process.env.NPM_CONFIG_PRODUCTION);
console.log('NODE_PATH=', process.env.NODE_PATH);
try {
  console.log('process.execPath=', process.execPath);
} catch (e) {
  console.warn('process.execPath lookup failed:', e && e.message);
}
try {
  const pathEnv = process.env.PATH || process.env.Path || process.env.path || '';
  console.log('PATH (truncated):', pathEnv.split(';').slice(0,8).join(';'));
} catch (e) {
  console.warn('Unable to read PATH:', e && e.message);
}
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
// explicitly check for package folders
try {
  const fs = require('fs');
  console.log('node_modules/archiver exists=', fs.existsSync('node_modules/archiver'));
  console.log('node_modules/cypress exists=', fs.existsSync('node_modules/cypress'));
} catch (e) {
  console.warn('Failed to check package folders:', e && e.message);
}
try {
  // prefer require.resolve to show exact resolution path or error
  try {
    try {
      console.log('archiver require.resolve.paths():', require.resolve.paths('archiver'));
    } catch (inner) {
      console.warn('require.resolve.paths archiver failed:', inner && inner.message);
    }
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
    try {
      console.log('cypress require.resolve.paths():', require.resolve.paths('cypress'));
    } catch (inner) {
      console.warn('require.resolve.paths cypress failed:', inner && inner.message);
    }
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
