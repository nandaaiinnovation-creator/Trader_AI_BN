import AdrPdrBreakoutRule from '../../src/services/rules/adrPdrBreakoutRule';
import { RuleContext } from '../../src/types/rules';

describe('ADR/PDR Breakout rule (TS)', () => {
  const candles = [{ open: 100, high: 102, low: 99, close: 101, volume: 1000 }];
  const dailyHistory = [
    { high: 105, low: 95, close: 100, volume: 1000 },
    { high: 110, low: 100, close: 105, volume: 1200 },
    { high: 115, low: 105, close: 110, volume: 1300 }
  ];
  const ctx: RuleContext = { candles: candles as any, marketState: { dailyHistory, atr: 1 }, symbol: 'BANKNIFTY' } as any;

  test('adrPdrBreakoutRule runs and returns a result', async () => {
    const rule = new AdrPdrBreakoutRule({ name: 'adrPdrBreakoutRule', params: { adr_period: 3, breakout_confirmation_atr: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
