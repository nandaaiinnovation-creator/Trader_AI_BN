import ORBRule from '../../src/services/rules/openingRangeBreakoutRule';
import { RuleContext } from '../../src/types/rules';

function tsAt(hour: number, minute: number, offsetMin = 0) {
  const d = new Date();
  d.setHours(hour, minute + offsetMin, 0, 0);
  return d.toISOString();
}

describe('Opening Range Breakout rule (TS)', () => {
  // Construct candles starting at 09:15 forming a small opening range then a breakout
  const marketOpenHour = 9;
  const marketOpenMin = 15;
  const candles = [] as any[];

  // Opening range minutes = 3 for the test
  for (let i = 0; i < 20; i++) {
    const minutesOffset = i;
    const base = 100 + (i <= 3 ? 0 : i * 0.1);
    const high = (i <= 3) ? 101 : base + 1;
    const low = (i <= 3) ? 99 : base - 1;
    const close = base;
    const volume = (i <= 3) ? 2000 : (i === 19 ? 8000 : 1000);
    const timestamp = tsAt(marketOpenHour, marketOpenMin, minutesOffset);
    candles.push({ timestamp, open: base - 0.5, high, low, close, volume });
  }

  // Last candle after opening range breaks above the opening high
  const last = candles[candles.length - 1];
  last.close = 106;
  last.high = 107;
  last.volume = 12000;

  const ctx: RuleContext = { candles: candles as any, marketState: { atr: 1 }, symbol: 'BANKNIFTY' } as any;

  test('openingRangeBreakoutRule detects bullish breakout', async () => {
    const rule = new ORBRule({ name: 'openingRangeBreakoutRule', params: { range_minutes: 3, volume_threshold: 0.5, breakout_confirm_ticks: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
    expect(res.pass).toBe(true);
    expect(res.reason).toMatch(/Bullish OR breakout/i);
  });
});
