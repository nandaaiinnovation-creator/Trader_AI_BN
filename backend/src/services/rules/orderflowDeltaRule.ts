import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class OrderflowDeltaRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['delta_window', 'min_flip_z', 'vwap_proximity_ticks']);
    const { delta_window, min_flip_z, vwap_proximity_ticks } = this.config.params;

    const candles = context.candles;
    const marketState = context.marketState;

    // Require cumulative delta / depth data
    const deltaSeries: number[] | undefined = (marketState.orderflow && marketState.orderflow.cumulativeDelta) || marketState.cumulativeDelta;
    if (!deltaSeries || deltaSeries.length < delta_window) {
      return this.createResult(false, 0, 'Orderflow delta data not available');
    }

    // Use last delta_window values
    const window = deltaSeries.slice(-delta_window);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const std = Math.sqrt(window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length);
    if (std === 0) return this.createResult(false, 0, 'Insufficient delta variance');

    const currentDelta = window[window.length - 1];
    const z = (currentDelta - mean) / std;

    // Check for delta flip (sign change) in window
    const signs = window.map(v => Math.sign(v));
    const flipped = signs.slice(-3).some((s, i, arr) => i > 0 && s !== arr[i - 1]);

    // Check VWAP proximity if available
    const vwap = candles[candles.length - 1].vwap || marketState.vwap;
    let nearVwap = true;
    if (vwap) {
      const tickSize = (marketState.tickSize || (marketState.atr || 1) / 10);
      nearVwap = Math.abs(candles[candles.length - 1].close - vwap) <= vwap_proximity_ticks * tickSize;
    }

    if (flipped && Math.abs(z) >= min_flip_z && nearVwap) {
      const strength = Math.min(Math.abs(z) / (min_flip_z * 2), 1);
      const dir = currentDelta > mean ? 'Bullish' : 'Bearish';
      return this.createResult(true, strength, `Orderflow delta flip near VWAP: ${dir} (z=${z.toFixed(2)})`);
    }

    return this.createResult(false, 0, 'No orderflow delta flip / confirmation');
  }
}
