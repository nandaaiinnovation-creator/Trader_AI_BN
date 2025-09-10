import BreakRetestRule from '../../src/services/rules/breakRetestRule';
import { RuleContext } from '../../src/types/rules';

describe('Break & Retest rule (TS)', () => {
  const candles = Array.from({ length: 60 }, (_, i) => ({
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 1000
  }));

  const ctx: RuleContext = { candles: candles as any, marketState: {} as any, symbol: 'BANKNIFTY' } as any;

  test('breakRetestRule should not throw and return a result', async () => {
    const rule = new BreakRetestRule({ name: 'breakRetestRule', params: { break_buffer_ticks: 2, retest_bars: 3 } } as any);
    const res = await rule.evaluate(ctx);
    expect(typeof res.reason).toBe('string');
  });
});
