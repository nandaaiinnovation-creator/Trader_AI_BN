import VolumeProfileRule from '../../src/services/rules/volumeProfileRule';
import { RuleContext } from '../../src/types/rules';

describe('Volume Profile rule (TS)', () => {
  const candles = Array.from({ length: 60 }, (_, i) => ({
    open: 300 + Math.cos(i / 5),
    high: 302 + Math.cos(i / 5),
    low: 299 + Math.cos(i / 5),
    close: 301 + Math.cos(i / 5),
    volume: 800 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('volumeProfileRule runs and returns a result', async () => {
    const rule = new VolumeProfileRule({ name: 'volumeProfileRule', params: { profile_periods: 50, price_levels: 20, vol_threshold_pct: 10 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
