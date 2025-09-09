import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { rsi, findPivots } from '../../utils/indicators';

export default class MomentumDivergenceRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['rsi_period', 'pivot_window', 'min_div_bars']);
    const { rsi_period, pivot_window, min_div_bars } = this.config.params;

    const closes = context.candles.map(c => c.close);
    const rsiValues = rsi(closes, rsi_period);

    if (rsiValues.length < pivot_window) {
      return this.createResult(false, 0, 'Insufficient data for divergence analysis');
    }

    // Find price and RSI pivots
    const { highs: priceHighs, lows: priceLows } = findPivots(closes, pivot_window);
    const { highs: rsiHighs, lows: rsiLows } = findPivots(rsiValues, pivot_window);

    // Get last two significant pivots
    const lastPriceHighs = priceHighs.slice(-2);
    const lastPriceLows = priceLows.slice(-2);
    const lastRsiHighs = rsiHighs.slice(-2);
    const lastRsiLows = rsiLows.slice(-2);

    // Check for valid pivot formations
    if (lastPriceHighs.length < 2 || lastRsiHighs.length < 2 ||
        lastPriceLows.length < 2 || lastRsiLows.length < 2) {
      return this.createResult(false, 0, 'Not enough pivot points for divergence');
    }

    // Check minimum bars between pivots
    const barsBetweenPriceHighs = Math.abs(lastPriceHighs[1] - lastPriceHighs[0]);
    const barsBetweenPriceLows = Math.abs(lastPriceLows[1] - lastPriceLows[0]);

    if (barsBetweenPriceHighs < min_div_bars && barsBetweenPriceLows < min_div_bars) {
      return this.createResult(false, 0, 'Pivots too close for valid divergence');
    }

    // Check for bearish divergence (higher price highs, lower RSI highs)
    if (closes[lastPriceHighs[1]] > closes[lastPriceHighs[0]] &&
        rsiValues[lastRsiHighs[1]] < rsiValues[lastRsiHighs[0]]) {
      const priceDiff = (closes[lastPriceHighs[1]] - closes[lastPriceHighs[0]]) / closes[lastPriceHighs[0]];
      const rsiDiff = rsiValues[lastRsiHighs[0]] - rsiValues[lastRsiHighs[1]];
      const strength = Math.min((priceDiff * 100 + rsiDiff) / 10, 1);

      return this.createResult(
        true,
        strength,
        `Bearish divergence: Price +${(priceDiff * 100).toFixed(2)}%, RSI -${rsiDiff.toFixed(2)}`
      );
    }

    // Check for bullish divergence (lower price lows, higher RSI lows)
    if (closes[lastPriceLows[1]] < closes[lastPriceLows[0]] &&
        rsiValues[lastRsiLows[1]] > rsiValues[lastRsiLows[0]]) {
      const priceDiff = (closes[lastPriceLows[0]] - closes[lastPriceLows[1]]) / closes[lastPriceLows[0]];
      const rsiDiff = rsiValues[lastRsiLows[1]] - rsiValues[lastRsiLows[0]];
      const strength = Math.min((priceDiff * 100 + rsiDiff) / 10, 1);

      return this.createResult(
        true,
        strength,
        `Bullish divergence: Price -${(priceDiff * 100).toFixed(2)}%, RSI +${rsiDiff.toFixed(2)}`
      );
    }

    return this.createResult(false, 0, 'No valid divergence pattern detected');
  }
}
