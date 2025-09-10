import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class ThreeBarThrustRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['thrust_bars', 'min_body_ratio']);
    const { thrust_bars, min_body_ratio } = this.config.params;

    const candles = context.candles;
    if (candles.length < thrust_bars) return this.createResult(false, 0, 'Insufficient bars');

    const recent = candles.slice(-thrust_bars);
    const bullish = recent.every(c => c.close > c.open && Math.abs(c.close - c.open) / (c.high - c.low || 1) > min_body_ratio);
    const bearish = recent.every(c => c.close < c.open && Math.abs(c.close - c.open) / (c.high - c.low || 1) > min_body_ratio);
    if (bullish) return this.createResult(true, 1, 'Three-bar bullish thrust');
    if (bearish) return this.createResult(true, 1, 'Three-bar bearish thrust');
    return this.createResult(false, 0, 'No three-bar thrust');
  }
}
