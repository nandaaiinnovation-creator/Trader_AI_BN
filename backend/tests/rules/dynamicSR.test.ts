import DynamicSRRule from '../../src/services/rules/dynamicSRRule';
import { RuleContext } from '../../src/types/rules';

describe('Dynamic S/R rule (TS)', () => {
  // Build candles that create a resistance near 110 (rounded to nearest 10) with multiple touches
  const base = 90;
  const candles = [] as any[];
  for (let i = 0; i < 55; i++) {
    // Inject repeated highs around 110 between indexes 10..30
    const close = base + i * 0.4;
    const high = (i >= 10 && i <= 30) ? 110 : close + 1;
    const low = close - 1;
    const volume = 1000 + (i % 5 === 0 ? 2000 : 100);
    candles.push({ open: close - 0.2, high, low, close, volume });
  }

  // Last candle breaks above 110
  candles[candles.length - 1] = { open: 112, high: 114, low: 111, close: 113, volume: 5000 };

  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('dynamicSRRule should detect nearby SR level and return a positive test/break message', async () => {
    const rule = new DynamicSRRule({ name: 'dynamicSRRule', params: { sr_lookback: 50, touch_threshold: 2, proximity_pct: 5 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
    expect(res.pass).toBe(true);
    expect(res.reason.length).toBeGreaterThan(0);
    expect(/Breaking|Testing|Nearest/i.test(res.reason)).toBe(true);
  });
});
