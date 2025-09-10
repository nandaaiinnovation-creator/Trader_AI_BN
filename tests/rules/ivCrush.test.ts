import IVCrushRule from '../../src/services/rules/ivCrushRule';
import { RuleContext } from '../../src/types/rules';

describe('IV Crush rule (TS)', () => {
  const candles = Array.from({ length: 20 }, (_, i) => ({ open: 700 + i, high: 701 + i, low: 699 + i, close: 700 + i, volume: 1000 }));
  const marketState = { optionIVs: Array.from({ length: 20 }, (_, i) => 0.5 + (i * 0.01)) };
  const ctx: RuleContext = { candles: candles as any, marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('ivCrushRule computes z and returns result', async () => {
    const rule = new IVCrushRule({ name: 'ivCrushRule', params: { iv_lookback: 14, z_threshold: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(typeof (res as any).z).toBe('number');
  expect((res as any).z).toBeGreaterThanOrEqual(0);
  });
});
