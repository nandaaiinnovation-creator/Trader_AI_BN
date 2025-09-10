import SpreadGuardRule from '../../src/services/rules/spreadGuardRule';
import { RuleContext } from '../../src/types/rules';

describe('Spread Guard rule (TS)', () => {
  const candles = [{ open: 100, high: 101, low: 99, close: 100, volume: 1000 }];
  const marketState = { spread_pct: 0.02, liquidity: 10000 };
  const ctx: RuleContext = { candles: candles as any, marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('spreadGuardRule runs and returns a result', async () => {
    const rule = new SpreadGuardRule({ name: 'spreadGuardRule', params: { max_spread_pct: 0.05, min_liquidity: 5000 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
