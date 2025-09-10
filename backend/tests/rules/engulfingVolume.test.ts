import EngulfingVolumeRule from '../../src/services/rules/engulfingVolumeRule';
import { RuleContext } from '../../src/types/rules';

describe('EngulfingVolume rule (TS)', () => {
  const candles = [
    { open: 100, high: 105, low: 99, close: 103, volume: 1000 },
    { open: 102, high: 110, low: 101, close: 109, volume: 5000 } // bullish engulf with high volume
  ];

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('engulfingVolumeRule runs and returns a result', async () => {
    const rule = new EngulfingVolumeRule({ name: 'engulfingVolumeRule', params: { min_volume_mult: 3, pivot_window: 1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
  });
});
