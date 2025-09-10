const fs = require('fs');
const path = require('path');
const { RulesEngine } = require('../src/services/rulesEngine');

// Load TS rules config as text and extract a minimal runtime config
function loadRulesConfig() {
  const cfgPath = path.resolve(__dirname, '../src/config/rules.ts');
  const text = fs.readFileSync(cfgPath, 'utf8');
  const match = text.match(/rules:\s*\{([\s\S]*?)\},\s*regimeWeights:/m);
  const rulesBody = match ? match[1] : '';
  const keyRegex = /([A-Za-z0-9_]+)\s*:\s*\{([\s\S]*?)\}/g;
  const rules = {};
  let m;
  while ((m = keyRegex.exec(rulesBody)) !== null) {
    const key = m[1];
    // crude: provide the raw params block as empty defaults for runtime
    rules[key] = { enabled: true, weight: 1.0, params: {} };
  }
  return { rules, regimeWeights: {} };
}

const defaultConfig = loadRulesConfig();

async function main() {
  const samplePath = path.resolve(__dirname, 'sample_candles.json');
  const raw = fs.readFileSync(samplePath, 'utf8');
  const candles = JSON.parse(raw);

  const engine = new RulesEngine(defaultConfig);

  const context = {
    symbol: 'BANKNIFTY',
    timeframe: '5m',
    candles: candles.map(c => ({
      timestamp: new Date(c.t),
      open: c.o,
      high: c.h,
      low: c.l,
      close: c.c,
      volume: c.v
    })),
    regime: 'TRENDING',
    marketState: {}
  };

  const results = {};
  for (const [name, rule] of engine['rules']) {
    try {
      const res = await rule.evaluate(context);
      results[name] = res;
    } catch (err) {
      results[name] = { pass: false, score: 0, reason: 'error ' + (err && err.message)};
    }
  }

  console.log('Rule evaluation results:');
  console.dir(results, { depth: 2 });
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run: main };
