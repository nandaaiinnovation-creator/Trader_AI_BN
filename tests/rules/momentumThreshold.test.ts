import MomentumThresholdRule from '../../src/services/rules/momentumThresholdRule';
import { RuleContext } from '../../src/types/rules';

describe('Momentum Threshold rule (TS)', () => {
  const candles = Array.from({ length: 100 }, (_, i) => ({
    open: 100 + i * 0.2,
    high: 101 + i * 0.2,
    low: 99 + i * 0.2,
    close: 100 + i * 0.2,
    volume: 1000 + i
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('momentumThresholdRule evaluates without throwing', async () => {
    const rule = new MomentumThresholdRule({ name: 'momentumThresholdRule', params: { momentum_period: 12, threshold_mult: 1.5, consec_bars: 3 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
