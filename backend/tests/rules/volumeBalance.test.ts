import VolumeBalanceRule from '../../src/services/rules/volumeBalanceRule';
import { RuleContext } from '../../src/types/rules';

describe('Volume Balance rule (TS)', () => {
  // Create candles where last candle has a large volume spike and price up
  const candles = [] as any[];
  for (let i = 0; i < 10; i++) {
    candles.push({ open: 100 + i * 0.5, high: 101 + i * 0.5, low: 99 + i * 0.5, close: 100 + i * 0.5, volume: 1000 + i * 10 });
  }
  // Add a recent bullish candle with very high volume
  candles.push({ open: 105, high: 110, low: 104, close: 109, volume: 20000 });

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('volumeBalanceRule identifies strong bullish volume confirmation', async () => {
    const rule = new VolumeBalanceRule({ name: 'volumeBalanceRule', params: { volume_ma_period: 3, obv_threshold: 50, price_confirm_pct: 0.5 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
    // Expect either potential accumulation or strong bullish volume message
    expect(res.pass).toBe(true);
    expect(/Strong bullish volume|Potential accumulation/i.test(res.reason)).toBe(true);
  });
});
