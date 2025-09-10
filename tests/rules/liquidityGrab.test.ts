import LiquidityGrabRule from '../../src/services/rules/liquidityGrabRule';
import { RuleContext } from '../../src/types/rules';

describe('Liquidity Grab rule (TS)', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({ open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 500 + i }));
  const ctx: RuleContext = { candles: candles as any, marketState: { atr: 20 }, symbol: 'BANKNIFTY' } as any;

  test('liquidityGrabRule evaluates without throwing', async () => {
    const rule = new LiquidityGrabRule({ name: 'liquidityGrabRule', params: { sweep_buffer_ticks: 2, confirm_close_within: 2, lookback: 10 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
