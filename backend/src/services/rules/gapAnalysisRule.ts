import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { atr } from '../../utils/indicators';

interface Gap {
  size: number;
  type: 'up' | 'down';
  filledPercent: number;
}

export default class GapAnalysisRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['min_gap_atr', 'lookback_bars', 'fill_threshold']);
    const { min_gap_atr, lookback_bars, fill_threshold } = this.config.params;

    const candles = context.candles;
    if (candles.length < lookback_bars + 1) {
      return this.createResult(false, 0, 'Insufficient data for gap analysis');
    }

    // Calculate ATR for gap size context
    const atrValues = atr(
      candles.map(c => c.high),
      candles.map(c => c.low),
      candles.map(c => c.close)
    );
    const currentAtr = atrValues[atrValues.length - 1];
    const minGapSize = currentAtr * min_gap_atr;

    // Find recent gaps
    const gaps: Gap[] = [];
    for (let i = candles.length - lookback_bars; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];

      // Up gap
      if (current.low > previous.high) {
        const gapSize = current.low - previous.high;
        if (gapSize >= minGapSize) {
          const lowestAfterGap = Math.min(...candles.slice(i).map(c => c.low));
          const filledPercent = Math.max(0, (current.low - lowestAfterGap) / gapSize * 100);
          gaps.push({ size: gapSize, type: 'up', filledPercent });
        }
      }
      // Down gap
      else if (current.high < previous.low) {
        const gapSize = previous.low - current.high;
        if (gapSize >= minGapSize) {
          const highestAfterGap = Math.max(...candles.slice(i).map(c => c.high));
          const filledPercent = Math.max(0, (highestAfterGap - current.high) / gapSize * 100);
          gaps.push({ size: gapSize, type: 'down', filledPercent });
        }
      }
    }

    if (gaps.length === 0) {
      return this.createResult(false, 0, 'No significant gaps detected');
    }

    // Analyze most recent gap
    const latestGap = gaps[gaps.length - 1];
    const normalizedSize = Math.min(latestGap.size / (currentAtr * 2), 1);

    // Check gap fill percentage
    if (latestGap.filledPercent < fill_threshold) {
      if (latestGap.type === 'up') {
        return this.createResult(
          true,
          normalizedSize,
          `Unfilled bullish gap: ${(latestGap.size / currentAtr).toFixed(2)}x ATR, ${latestGap.filledPercent.toFixed(1)}% filled`
        );
      } else {
        return this.createResult(
          true,
          normalizedSize,
          `Unfilled bearish gap: ${(latestGap.size / currentAtr).toFixed(2)}x ATR, ${latestGap.filledPercent.toFixed(1)}% filled`
        );
      }
    }

    return this.createResult(false, 0, `Recent ${latestGap.type} gap ${latestGap.filledPercent.toFixed(1)}% filled`);
  }
}
