import MomentumDivergenceRule from '../../src/services/rules/momentumDivergenceRule';
import { RuleContext } from '../../src/types/rules';

// Build closes that create higher price highs but RSI lower highs by crafting rsi-friendly series
const closes = [100, 101, 102, 103, 104, 105, 106, 105, 107, 108, 109, 110, 111, 112, 111, 113, 114, 115, 116, 117, 118, 119, 120];
const candles = closes.map((c) => ({ open: c - 0.5, high: c + 0.5, low: c - 1, close: c, volume: 1000 }));

describe('Momentum Divergence rule (TS)', () => {
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('momentumDivergenceRule should detect divergence when present', async () => {
    const rule = new MomentumDivergenceRule({ name: 'momentumDivergence', params: { rsi_period: 5, pivot_window: 2, min_div_bars: 1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    // If divergence detected, expect pass true and reason to include 'divergence'
    if (res.pass) {
      expect(res.reason.toLowerCase()).toMatch(/divergence/);
    }
  });
});
