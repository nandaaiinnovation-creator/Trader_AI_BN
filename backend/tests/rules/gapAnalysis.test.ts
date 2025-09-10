import GapAnalysisRule from '../../src/services/rules/gapAnalysisRule';
import { RuleContext } from '../../src/types/rules';

describe('Gap Analysis rule (TS)', () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 500
  }));

  // Introduce a gap up near the end
  candles[25].low = candles[24].high + 10;
  candles[25].high = candles[25].low + 2;

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('gapAnalysisRule processes without throwing', async () => {
    const rule = new GapAnalysisRule({ name: 'gapAnalysisRule', params: { min_gap_atr: 0.5, lookback_bars: 10, fill_threshold: 50 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
