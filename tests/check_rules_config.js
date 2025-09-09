const fs = require('fs');
const path = require('path');
// Read the TypeScript config file as text and extract configured rule keys to avoid requiring TS at runtime
const configPath = path.resolve(__dirname, '../src/config/rules.ts');
const configText = fs.readFileSync(configPath, 'utf8');

function extractRuleKeysFromText(text) {
  const match = text.match(/rules:\s*\{([\s\S]*?)\},\s*regimeWeights:/m);
  if (!match) return [];
  const body = match[1];
  // crude regex to match top-level keys: identifier followed by :
  const keys = [];
  const keyRegex = /([A-Za-z0-9_]+)\s*:/g;
  let m;
  while ((m = keyRegex.exec(body)) !== null) {
    keys.push(m[1]);
  }
  return Array.from(new Set(keys));
}

const configured = extractRuleKeysFromText(configText);

function listRuleFiles() {
  const dir = path.resolve(__dirname, '../src/services/rules');
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => f.replace(/\.ts$|\.js$/,''));
}

function missingConfigs() {
  const ruleFiles = listRuleFiles();
  return ruleFiles.filter(r => {
    if (r === 'base') return false;
    const variants = [r, r.replace(/Rule$/, ''), r + 'Rule'];
    return !variants.some(v => configured.includes(v));
  });
}

if (require.main === module) {
  const missing = missingConfigs();
  if (missing.length === 0) {
    console.log('PASS: All rule files have config entries. Total rules:', configured.length);
    process.exit(0);
  } else {
    console.error('FAIL: Missing config for rule files:', missing);
    process.exit(2);
  }
}

module.exports = { listRuleFiles, missingConfigs };
