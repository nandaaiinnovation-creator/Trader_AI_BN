import InsideBarRule from '../../src/services/rules/insideBarRule';
import { RuleContext } from '../../src/types/rules';

describe('InsideBar rule (TS)', () => {
  const candles = [
    { open: 100, high: 110, low: 90, close: 105, volume: 1000 }, // prev
    { open: 102, high: 105, low: 95, close: 100, volume: 800 }  // inside bar (narrower range)
  ];

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('insideBarRule runs and returns a result', async () => {
    const rule = new InsideBarRule({ name: 'insideBarRule', params: { lookback: 2, breakout_confirm_ticks: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
