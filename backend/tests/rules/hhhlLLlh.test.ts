import HHHLLLLHRule from '../../src/services/rules/hhhlLLlh';
import { RuleContext } from '../../src/types/rules';

// Small synthetic candles to allow pivot detection and ATR calculation
const candles = [
  { open: 100, high: 105, low: 99, close: 104, volume: 1000 },
  { open: 104, high: 108, low: 103, close: 107, volume: 1100 },
  { open: 107, high: 112, low: 106, close: 110, volume: 1200 },
  { open: 110, high: 111, low: 109, close: 110, volume: 900 }
];

describe('HHHL/LLLH rule (TS)', () => {
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('hhhlLLlh runs and returns a result', async () => {
    const rule = new HHHLLLLHRule({ name: 'hhhlLLlh', params: { pivots_window: 1, min_leg_size_atr: 0.5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
