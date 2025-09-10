import MarketProfileRule from '../../src/services/rules/marketProfileRule';
import { RuleContext } from '../../src/types/rules';

describe('MarketProfile rule (TS)', () => {
  const candles = Array.from({ length: 5 }, (_, i) => ({ open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1000 }));
  const dailyHistory = [
    { close: 100, volume: 1000 },
    { close: 110, volume: 1500 },
    { close: 120, volume: 2000 }
  ];

  const ctx: RuleContext = { candles: candles as any, marketState: { dailyHistory }, symbol: 'BANKNIFTY' } as any;

  test('marketProfileRule runs and returns a result', async () => {
    const rule = new MarketProfileRule({ name: 'marketProfileRule', params: { profile_lookback_days: 3, value_area_pct: 70 } } as any);
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
