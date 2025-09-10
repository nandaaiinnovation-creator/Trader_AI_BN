import TrendHTFRule from '../../src/services/rules/trendHTF';
import { RuleContext } from '../../src/types/rules';

describe('Trend HTF rule (TS)', () => {
  const candles = Array.from({ length: 50 }, (_, i) => ({
    open: 200 + i * 0.1,
    high: 201 + i * 0.1,
    low: 199 + i * 0.1,
    close: 200 + i * 0.1,
    volume: 800 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('trendHTFRule evaluates without throwing', async () => {
    const rule = new TrendHTFRule({ name: 'trendHTFRule', params: { ema_fast: 8, ema_slow: 21, confirm_bars: 3 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res).toEqual(expect.objectContaining({
      pass: expect.any(Boolean),
      reason: expect.any(String),
    }));
  });
});
