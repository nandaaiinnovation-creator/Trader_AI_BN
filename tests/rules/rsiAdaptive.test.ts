import RSIAdaptiveRule from '../../src/services/rules/rsiAdaptive';
import { RuleContext } from '../../src/types/rules';

describe('RSI Adaptive rule (TS)', () => {
  const candles = Array.from({ length: 60 }, (_, i) => ({
    open: 150 + Math.sin(i / 5),
    high: 151 + Math.sin(i / 5),
    low: 149 + Math.sin(i / 5),
    close: 150 + Math.sin(i / 5),
    volume: 700
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY', regime: 'RANGE' } as any;

  test('rsiAdaptiveRule responds without throwing', async () => {
    const rule = new RSIAdaptiveRule({ name: 'rsiAdaptiveRule', params: { rsi_len: 14, upper: 70, lower: 30, cooldown_bars: 5 } } as any);
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
