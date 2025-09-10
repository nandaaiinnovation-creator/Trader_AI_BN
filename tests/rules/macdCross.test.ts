import MacdCrossRule from '../../src/services/rules/macdCrossRule';
import { RuleContext } from '../../src/types/rules';

describe('MACD Cross rule (TS)', () => {
  const candles = Array.from({ length: 100 }, (_, i) => ({
    open: 100 + i * 0.1,
    high: 101 + i * 0.1,
    low: 99 + i * 0.1,
    close: 100 + i * 0.1,
    volume: 1000 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('macdCrossRule evaluates without throwing', async () => {
    const rule = new MacdCrossRule({ name: 'macdCrossRule', params: { fast: 12, slow: 26, signal: 9, min_hist_slope: 0.001 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
