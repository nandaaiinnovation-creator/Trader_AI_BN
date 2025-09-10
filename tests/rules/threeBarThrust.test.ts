import ThreeBarThrustRule from '../../src/services/rules/threeBarThrustRule';
import { RuleContext } from '../../src/types/rules';

describe('Three Bar Thrust rule (TS)', () => {
  const candles = Array.from({ length: 50 }, (_, i) => ({
    open: 300 + i,
    high: 302 + i,
    low: 299 + i,
    close: 301 + i,
    volume: 800
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('threeBarThrustRule should process without throwing', async () => {
    const rule = new ThreeBarThrustRule({ name: 'threeBarThrustRule', params: { thrust_bars: 3, min_body_ratio: 0.5 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
  });
});
