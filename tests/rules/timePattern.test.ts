import TimePatternRule from '../../src/services/rules/timePatternRule';
import { RuleContext } from '../../src/types/rules';

// Build 20 candles with timestamps inside the trending window (09:35)
const baseTime = new Date();
baseTime.setHours(9, 35, 0, 0);
const candles = Array.from({ length: 20 }, (_, i) => ({ open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1000, timestamp: new Date(baseTime.getTime() + i * 60000) }));

describe('Time Pattern rule (TS)', () => {
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('timePatternRule runs and returns a result', async () => {
    const rule = new TimePatternRule({ name: 'timePattern', params: { volatility_threshold: 0.001, trend_threshold: 0.0005, reversal_threshold: 0.1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
  });
});
