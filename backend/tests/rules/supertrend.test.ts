import SupertrendRule from '../../src/services/rules/supertrendRule';
import { RuleContext } from '../../src/types/rules';

describe('Supertrend rule (TS)', () => {
  test('supertrendRule detects bullish fresh flip', async () => {
    const candles = [] as any[];
    // Build steady candles to make ATR small
    for (let i = 0; i < 20; i++) {
      candles.push({ open: 100 + i * 0.01, high: 100 + i * 0.01 + 0.1, low: 100 + i * 0.01 - 0.1, close: 100 + i * 0.01, volume: 1000 });
    }
    // Previous close
    candles.push({ open: 100.2, high: 100.3, low: 100.1, close: 100.2, volume: 1000 });
    // Last candle with strong bullish move
    candles.push({ open: 100.2, high: 110, low: 100.1, close: 110, volume: 10000 });

    const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;
    // Use very small multiplier to make band tiny
    const rule = new SupertrendRule({ name: 'supertrendRule', params: { atr_period: 5, multiplier: 0.01, fresh_flip_bars: 3 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
    expect(res.pass).toBe(true);
    expect(/Supertrend bullish fresh flip/i.test(res.reason)).toBe(true);
  });
});
