const MACDCrossRule = require('../../dist/services/rules/macdCrossRule').default;
const MomentumThresholdRule = require('../../dist/services/rules/momentumThresholdRule').default;

describe('MACD-related rules with insufficient data', () => {
  const shortCandles = Array.from({ length: 5 }, (_, i) => ({
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 1000
  }));

  const ctx = {
    candles: shortCandles,
    marketState: {},
    symbol: 'BANKNIFTY'
  };

  test('macdCrossRule should return insufficient data result and not throw', async () => {
    const rule = new MACDCrossRule({ name: 'macdCrossRule', params: { fast: 12, slow: 26, signal: 9, min_hist_slope: 0.001 } });
    const res = await rule.evaluate(ctx);
    expect(res.pass).toBe(false);
    expect(typeof res.reason).toBe('string');
    expect(res.reason.toLowerCase()).toMatch(/insufficient data|macd/);
  });

  test('momentumThresholdRule should return insufficient data result and not throw', async () => {
    const rule = new MomentumThresholdRule({ name: 'momentumThresholdRule', params: { momentum_period: 12, threshold_mult: 1.5, consec_bars: 3 } });
    const res = await rule.evaluate(ctx);
    expect(res.pass).toBe(false);
    expect(typeof res.reason).toBe('string');
    expect(res.reason.toLowerCase()).toMatch(/insufficient data|momentum/);
  });
});
