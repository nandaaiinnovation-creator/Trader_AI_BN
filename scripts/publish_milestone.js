#!/usr/bin/env node
// publish_milestone.js
// Usage: node ./scripts/publish_milestone.js [--prfile path] [--base develop]
// Behavior:
// - Only runs if a milestone marker is present (file `.milestone_done`) OR
//   environment variable PUBLISH_MILESTONE=1 is set OR git config hooks.allowPublish true.
// - Pushes current branch (one-off: sets ALLOW_PUSH=1 env when invoking git push so Husky allows it).
// - Finds a PR draft file (either provided via --prfile or first PR_DRAFT_*.md) and uses GitHub CLI
//   to create a draft PR with the PR draft content as the body, targeting the specified base (default: develop).

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts) {
  return execSync(cmd, { stdio: 'inherit', env: Object.assign({}, process.env, opts && opts.env) });
}

function runQuiet(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).toString().trim();
}

function fatal(msg) {
  console.error('ERROR:', msg);
  process.exit(1);
}

// Check milestone condition
const milestoneFile = path.resolve('.milestone_done');
const publishEnv = process.env.PUBLISH_MILESTONE === '1';
const allowConfig = (() => {
  try { return runQuiet('git config --bool hooks.allowPublish'); } catch (e) { return ''; }
})();

if (!fs.existsSync(milestoneFile) && !publishEnv && allowConfig !== 'true') {
  console.log('No milestone marker found (.milestone_done), PUBLISH_MILESTONE not set, and git config hooks.allowPublish not true.');
  console.log('Aborting publish. Create .milestone_done or set PUBLISH_MILESTONE=1 to override.');
  process.exit(1);
}

// Determine current branch
const branch = runQuiet('git rev-parse --abbrev-ref HEAD');
console.log('Current branch:', branch);

// Determine PR draft file
const argv = process.argv.slice(2);
let prfileArg = null;
let base = 'develop';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--prfile' && argv[i+1]) { prfileArg = argv[i+1]; i++; }
  if (argv[i] === '--base' && argv[i+1]) { base = argv[i+1]; i++; }
}

let prfile = prfileArg ? path.resolve(prfileArg) : null;
if (!prfile) {
  // find first PR_DRAFT_*.md in repo root
  const files = fs.readdirSync(process.cwd()).filter(f => /^PR_DRAFT_.*\.md$/.test(f));
  if (files.length === 0) fatal('No PR_DRAFT_*.md file found in repo root. Pass --prfile to specify.');
  prfile = path.resolve(files[0]);
}
if (!fs.existsSync(prfile)) fatal('PR file not found: ' + prfile);

// Extract title (first line starting with Title: )
const content = fs.readFileSync(prfile, 'utf8');
const m = content.match(/^Title:\s*(.*)$/m);
const title = m ? m[1].trim() : (path.basename(prfile, '.md'));

console.log('Using PR draft file:', prfile);
console.log('PR title:', title);

// Push the branch (allow push by setting ALLOW_PUSH=1 so Husky pre-push allows it)
console.log('Pushing branch to origin...');
try {
  run(`git push -u origin ${branch}`, { env: { ALLOW_PUSH: '1' } });
} catch (e) {
  fatal('git push failed: ' + e.message);
}

// Create draft PR using GitHub CLI
try {
  console.log('Creating draft PR via gh...');
  // gh supports --title and --body-file and --draft
  run(`gh pr create --base ${base} --head ${branch} --title "${title.replace(/\"/g,'\\\"')}" --body-file "${prfile}" --draft`);
  console.log('\nDraft PR created (if gh CLI is authenticated).');
} catch (e) {
  fatal('gh pr create failed: ' + e.message + '\nEnsure GitHub CLI is installed and authenticated.');
}

// Optionally remove milestone marker (commented out by default)
// fs.unlinkSync(milestoneFile);

console.log('Publish complete.');
