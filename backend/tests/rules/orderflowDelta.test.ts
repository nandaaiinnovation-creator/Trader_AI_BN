import OrderflowDeltaRule from '../../src/services/rules/orderflowDeltaRule';
import { RuleContext } from '../../src/types/rules';

describe('Orderflow Delta rule (TS)', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({ open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 500 }));

  const marketState = { cumulativeDelta: Array.from({ length: 30 }, (_, i) => i % 2 === 0 ? i : -i), vwap: 100, atr: 20 };

  const ctx: RuleContext = { candles: candles as any, marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('orderflowDeltaRule runs and returns result', async () => {
    const rule = new OrderflowDeltaRule({ name: 'orderflowDeltaRule', params: { delta_window: 10, min_flip_z: 1.5, vwap_proximity_ticks: 2 } } as any);
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
