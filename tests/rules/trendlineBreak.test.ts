import TrendlineBreakRule from '../../src/services/rules/trendlineBreak';
import { RuleContext } from '../../src/types/rules';

describe('Trendline Break rule (TS)', () => {
  test('trendlineBreakRule returns insufficient volume when volume low', async () => {
    // Recent volumes have variance but current volume is very low -> volumeZ << min_volume_z
    const candles = [] as any[];
    for (let i = 0; i < 25; i++) {
      candles.push({ open: 100 + i * 0.1, high: 101 + i * 0.1, low: 99 + i * 0.1, close: 100 + i * 0.1, volume: 100 + i * 10 });
    }
    // Current candle with very low volume
    candles.push({ open: 127, high: 128, low: 126, close: 127, volume: 1 });

    const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;
    const rule = new TrendlineBreakRule({ name: 'trendlineBreakRule', params: { pivots_window: 3, break_buffer: 1, min_volume_z: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
    expect(res.reason).toMatch(/Insufficient volume/i);
  });

  test('trendlineBreakRule proceeds when recent volume is high', async () => {
    const candles = [] as any[];
    for (let i = 0; i < 25; i++) {
      candles.push({ open: 100 + i * 0.1, high: 101 + i * 0.1, low: 99 + i * 0.1, close: 100 + i * 0.1, volume: 100 + i * 10 });
    }
    // Current candle with high volume to allow z-score > threshold and possibly detect a break
    candles.push({ open: 130, high: 140, low: 129, close: 139, volume: 50000 });

    const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;
    const rule = new TrendlineBreakRule({ name: 'trendlineBreakRule', params: { pivots_window: 3, break_buffer: 1, min_volume_z: -1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
  });
});
