import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { findPivots, atr } from '../../utils/indicators';

export default class HHHLLLLHRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['pivots_window', 'min_leg_size_atr']);
    const { pivots_window, min_leg_size_atr } = this.config.params;

    const highs = context.candles.map(c => c.high);
    const lows = context.candles.map(c => c.low);
    const closes = context.candles.map(c => c.close);

    // Calculate ATR for leg size comparison
    const atrValues = atr(highs, lows, closes);
    const currentAtr = atrValues[atrValues.length - 1];
    const minLegSize = currentAtr * min_leg_size_atr;

    // Find pivot points
    const { highs: highPivots, lows: lowPivots } = findPivots(closes, pivots_window);

    if (highPivots.length < 2 || lowPivots.length < 2) {
      return this.createResult(false, 0, 'Not enough pivot points for pattern analysis');
    }

    // Get last two highs and lows
    const lastTwoHighs = highPivots.slice(-2).map(i => highs[i]);
    const lastTwoLows = lowPivots.slice(-2).map(i => lows[i]);

    // Check for Higher High & Higher Low pattern
    if (lastTwoHighs[1] > lastTwoHighs[0] && lastTwoLows[1] > lastTwoLows[0]) {
      const highLegSize = lastTwoHighs[1] - lastTwoHighs[0];
      const lowLegSize = lastTwoLows[1] - lastTwoLows[0];

      if (highLegSize > minLegSize && lowLegSize > minLegSize) {
        const strength = Math.min((highLegSize + lowLegSize) / (2 * currentAtr), 1);
        return this.createResult(
          true,
          strength,
          `Bullish HHHL: HH=${lastTwoHighs[1].toFixed(2)}, HL=${lastTwoLows[1].toFixed(2)}`
        );
      }
    }

    // Check for Lower Low & Lower High pattern
    if (lastTwoHighs[1] < lastTwoHighs[0] && lastTwoLows[1] < lastTwoLows[0]) {
      const highLegSize = lastTwoHighs[0] - lastTwoHighs[1];
      const lowLegSize = lastTwoLows[0] - lastTwoLows[1];

      if (highLegSize > minLegSize && lowLegSize > minLegSize) {
        const strength = Math.min((highLegSize + lowLegSize) / (2 * currentAtr), 1);
        return this.createResult(
          true,
          strength,
          `Bearish LLLH: LL=${lastTwoLows[1].toFixed(2)}, LH=${lastTwoHighs[1].toFixed(2)}`
        );
      }
    }

    return this.createResult(false, 0, 'No valid HH-HL or LL-LH pattern detected');
  }
}
