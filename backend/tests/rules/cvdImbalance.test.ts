import CVDImbalanceRule from '../../src/services/rules/cvdImbalanceRule';
import { RuleContext } from '../../src/types/rules';

describe('CVD Imbalance rule (TS)', () => {
  // create tick stream biased to buys
  const ticks = Array.from({ length: 30 }, (_, i) => ({ price: 100 + i, volume: 10, side: i < 25 ? 'buy' : 'sell' }));
  const ctx: RuleContext = { candles: [], marketState: { ticks }, symbol: 'BANKNIFTY' } as any;

  test('cvdImbalanceRule runs and returns a result', async () => {
    const rule = new CVDImbalanceRule({ name: 'cvdImbalanceRule', params: { cvd_window: 20, z_threshold: 50 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
  });
});
