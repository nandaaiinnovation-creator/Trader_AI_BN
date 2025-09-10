import defaultConfig from '../config/rules';
import { RulesEngine } from '../services/rulesEngine';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const samplePath = path.resolve(__dirname, '../../scripts/sample_candles.json');
  const raw = fs.readFileSync(samplePath, 'utf8');
  const candles = JSON.parse(raw) as any[];

  const engine = new RulesEngine(defaultConfig as any);

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
  } as any;

  const results: Record<string, any> = {};
  for (const [name, rule] of (engine as any).rules) {
    try {
      const res = await rule.evaluate(context as any);
      results[name] = res;
    } catch (err: any) {
      results[name] = { pass: false, score: 0, reason: 'error ' + (err && err.message) };
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

export default main;
