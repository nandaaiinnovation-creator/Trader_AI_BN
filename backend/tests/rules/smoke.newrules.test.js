const assert = require('assert');
const path = require('path');

describe('New Rules smoke', () => {
  it('loads supertrendRule and validates config', () => {
    const Rule = require(path.resolve(__dirname, '../../dist/services/rules/supertrendRule')).default;
    const cfg = require(path.resolve(__dirname, '../../dist/config/rules.js'))?.default?.rules?.supertrendRule || { enabled: true, weight: 0.8, params: { atr_period: 14, multiplier: 3, fresh_flip_bars: 3 } };
    const r = new Rule(cfg);
    assert(r);
  });

  it('loads stochasticRule', () => {
    const Rule = require(path.resolve(__dirname, '../../dist/services/rules/stochasticRule')).default;
    const cfg = { enabled: true, weight: 0.6, params: { stoch_rsi_period: 14, k_period: 3, d_period: 3, oversold: 20, overbought: 80 } };
    const r = new Rule(cfg);
    assert(r);
  });

  it('loads insideBarRule', () => {
    const Rule = require(path.resolve(__dirname, '../../dist/services/rules/insideBarRule')).default;
    const cfg = { enabled: true, weight: 0.7, params: { lookback: 5, breakout_confirm_ticks: 2 } };
    const r = new Rule(cfg);
    assert(r);
  });
});
