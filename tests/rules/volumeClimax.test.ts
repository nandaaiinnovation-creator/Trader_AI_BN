import VolumeClimaxRule from '../../src/services/rules/volumeClimaxRule';
import { RuleContext } from '../../src/types/rules';

describe('Volume Climax rule (TS)', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({
    open: 120 + i,
    high: 121 + i,
    low: 119 + i,
    close: 120 + i,
    volume: i === 29 ? 10000 : 500
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('volumeClimaxRule detects climax without throwing', async () => {
    const rule = new VolumeClimaxRule({ name: 'volumeClimaxRule', params: { volume_ma_period: 5, climax_mult: 5, price_reversal_pct: 0.5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
