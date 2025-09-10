import MarketThrustRule from '../../src/services/rules/marketThrustRule';
import { RuleContext } from '../../src/types/rules';

describe('Market Thrust rule (TS)', () => {
  const candles = Array.from({ length: 80 }, (_, i) => ({ open: 200 + Math.sin(i/5), high: 201 + Math.sin(i/5), low: 199 + Math.sin(i/5), close: 200 + Math.sin(i/5), volume: 800 + (i%5===0?2000:100) }));
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('marketThrustRule detects thrusts without throwing', async () => {
    const rule = new MarketThrustRule({ name: 'marketThrustRule', params: { thrust_window: 20, volume_mult: 2, min_thrusts: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });

  test('marketThrustRule should detect bullish thrusts', async () => {
    const candles = [] as any[];
    // Build baseline candles with small bodies and volumes
    for (let i = 0; i < 30; i++) {
      candles.push({ open: 100 + i * 0.01, high: 100 + i * 0.01 + 0.2, low: 100 + i * 0.01 - 0.2, close: 100 + i * 0.01, volume: 1000 });
    }
    // Insert a few thrust candles with large bodies and high volume
    for (let j = 0; j < 3; j++) {
      const base = 100 + 30 * 0.01 + j * 5;
      candles.push({ open: base, high: base + 20, low: base - 1, close: base + 18, volume: 10000 });
    }

    const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;
    const rule = new MarketThrustRule({ name: 'marketThrustRule', params: { thrust_window: 10, volume_mult: 3, min_thrusts: 2 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(res.pass).toBe(true);
    expect(res.reason).toMatch(/Bullish thrust pattern/i);
  });
});
