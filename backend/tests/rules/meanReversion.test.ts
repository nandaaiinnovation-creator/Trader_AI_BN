import MeanReversionRule from '../../src/services/rules/meanReversionRule';
import { RuleContext } from '../../src/types/rules';

describe('Mean Reversion rule (TS)', () => {
  const candles = Array.from({ length: 80 }, (_, i) => ({
    open: 250 + Math.sin(i / 4),
    high: 252 + Math.sin(i / 4),
    low: 248 + Math.sin(i / 4),
    close: 250 + Math.sin(i / 4),
    volume: 900 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('meanReversionRule runs and returns a result', async () => {
    const rule = new MeanReversionRule({ name: 'meanReversionRule', params: { bb_period: 20, bb_std: 2, min_vol_ratio: 0.001, mean_revert_bars: 5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
