import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { ema } from '../../utils/indicators';

export default class TrendHTFRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['ema_fast', 'ema_slow', 'confirm_bars']);
    const { ema_fast, ema_slow, confirm_bars } = this.config.params;

    const closes = context.candles.map(c => c.close);
    const fastEma = ema(closes, ema_fast);
    const slowEma = ema(closes, ema_slow);

    // Need enough data points after EMA calculation
    if (fastEma.length < confirm_bars || slowEma.length < confirm_bars) {
      return this.createResult(false, 0, 'Not enough data for HTF trend analysis');
    }

    // Check if EMAs are aligned for the last N bars
    const lastFast = fastEma.slice(-confirm_bars);
    const lastSlow = slowEma.slice(-confirm_bars);
    
    let bullish = true;
    let bearish = true;

    for (let i = 0; i < confirm_bars; i++) {
      if (lastFast[i] <= lastSlow[i]) bullish = false;
      if (lastFast[i] >= lastSlow[i]) bearish = false;
    }

    // Calculate trend strength based on EMA separation
    const separation = Math.abs(lastFast[lastFast.length - 1] - lastSlow[lastSlow.length - 1]) / lastSlow[lastSlow.length - 1];
    const normalizedStrength = Math.min(separation / 0.01, 1); // Cap at 1% separation for full strength

    if (bullish) {
      return this.createResult(true, normalizedStrength, `HTF trend bullish: Fast EMA(${ema_fast}) above Slow EMA(${ema_slow}) for ${confirm_bars} bars`);
    }

    if (bearish) {
      return this.createResult(true, normalizedStrength, `HTF trend bearish: Fast EMA(${ema_fast}) below Slow EMA(${ema_slow}) for ${confirm_bars} bars`);
    }

    return this.createResult(false, 0, 'No clear HTF trend alignment');
  }
}
