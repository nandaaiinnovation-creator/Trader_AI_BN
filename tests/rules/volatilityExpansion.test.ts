import VolatilityExpansionRule from '../../src/services/rules/volatilityExpansionRule';
import { RuleContext } from '../../src/types/rules';

describe('Volatility Expansion rule (TS)', () => {
  const candles = Array.from({ length: 100 }, (_, i) => ({
    open: 200 + Math.sin(i / 10),
    high: 201 + Math.sin(i / 10),
    low: 199 + Math.sin(i / 10),
    close: 200 + Math.sin(i / 10),
    volume: 800 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: { atr: 15 } as any, symbol: 'BANKNIFTY' } as any;

  test('volatilityExpansionRule runs and returns a result', async () => {
    const rule = new VolatilityExpansionRule({ name: 'volatilityExpansionRule', params: { atr_period: 14, expansion_factor: 2.0, min_bars_above: 3 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
