import ATRNormalizationRule from '../../src/services/rules/atrNormalizationRule';
import { RuleContext } from '../../src/types/rules';

describe('ATR Normalization rule (TS)', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({ open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1000 }));
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('atrNormalizationRule runs and returns a result', async () => {
    const rule = new ATRNormalizationRule({ name: 'atrNormalizationRule', params: { atr_period: 14, max_atr_mult: 0.05 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
