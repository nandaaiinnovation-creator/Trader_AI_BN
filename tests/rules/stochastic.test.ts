import StochasticRule from '../../src/services/rules/stochasticRule';
import { RuleContext } from '../../src/types/rules';

describe('Stochastic rule (TS)', () => {
  const candles = Array.from({ length: 50 }, (_, i) => ({
    open: 120 + Math.cos(i / 3) * 1.5,
    high: 121 + Math.cos(i / 3) * 1.5,
    low: 119 + Math.cos(i / 3) * 1.5,
    close: 120 + Math.cos(i / 3) * 1.5,
    volume: 600
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('stochasticRule returns a result object', async () => {
    const rule = new StochasticRule({ name: 'stochasticRule', params: { stoch_rsi_period: 14, k_period: 14, d_period: 3, oversold: 20, overbought: 80 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
