import WickRejectionRule from '../../src/services/rules/wickRejectionRule';
import { RuleContext } from '../../src/types/rules';

describe('Wick Rejection rule (TS)', () => {
  const candles = Array.from({ length: 40 }, (_, i) => ({
    open: 200 - i,
    high: 201 - i,
    low: 199 - i,
    close: 200 - i,
    volume: 500
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('wickRejectionRule should return a result object', async () => {
    const rule = new WickRejectionRule({ name: 'wickRejectionRule', params: { wick_threshold_pct: 0.5, use_vwap_or_bb: true } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
