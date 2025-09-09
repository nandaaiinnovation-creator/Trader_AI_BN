import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { atr } from '../../utils/indicators';

export default class VolatilityExpansionRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['atr_period', 'expansion_factor', 'min_bars_above']);
    const { atr_period, expansion_factor, min_bars_above } = this.config.params;

    const highs = context.candles.map(c => c.high);
    const lows = context.candles.map(c => c.low);
    const closes = context.candles.map(c => c.close);
    
    // Calculate ATR
    const atrValues = atr(highs, lows, closes, atr_period);
    if (atrValues.length < min_bars_above + 1) {
      return this.createResult(false, 0, 'Insufficient data for volatility analysis');
    }

    // Calculate baseline ATR (moving average of ATR)
    const baselineWindow = 20;
    const recentAtr = atrValues.slice(-baselineWindow);
    const baselineAtr = recentAtr.reduce((sum, val) => sum + val, 0) / baselineWindow;

    // Get recent ATR values for expansion check
    const checkWindow = atrValues.slice(-min_bars_above);
    const currentAtr = checkWindow[checkWindow.length - 1];

    // Check for volatility expansion
    const isExpanded = checkWindow.every(val => val > baselineAtr * expansion_factor);
    if (!isExpanded) {
      return this.createResult(false, 0, 'No significant volatility expansion');
    }

    // Calculate trend direction during expansion
    const priceChange = closes[closes.length - 1] - closes[closes.length - min_bars_above];
    const normalizedStrength = Math.min((currentAtr / baselineAtr - expansion_factor) / 2, 1);

    if (priceChange > 0) {
      return this.createResult(
        true,
        normalizedStrength,
        `Bullish volatility expansion: ATR ${(currentAtr / baselineAtr).toFixed(2)}x baseline`
      );
    } else {
      return this.createResult(
        true,
        normalizedStrength,
        `Bearish volatility expansion: ATR ${(currentAtr / baselineAtr).toFixed(2)}x baseline`
      );
    }
  }
}
