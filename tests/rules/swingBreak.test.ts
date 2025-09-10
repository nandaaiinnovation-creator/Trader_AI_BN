import SwingBreakRule from '../../src/services/rules/swingBreak';
import { RuleContext } from '../../src/types/rules';

describe('Swing Break rule (TS)', () => {
  const candles = Array.from({ length: 40 }, (_, i) => ({ open: 150 + i, high: 151 + i, low: 149 + i, close: 150 + i, volume: 600 + i }));
  const ctx: RuleContext = { candles: candles as any, marketState: { atr: 20 }, symbol: 'BANKNIFTY' } as any;

  test('swingBreakRule returns a result', async () => {
    const rule = new SwingBreakRule({ name: 'swingBreakRule', params: { lookback_swing: 5, close_buffer_ticks: 1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
  });
});
