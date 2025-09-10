import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class BreakRetestRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['break_buffer_ticks', 'retest_bars']);
    const { break_buffer_ticks, retest_bars } = this.config.params;

    const candles = context.candles;
    if (candles.length < retest_bars + 2) return this.createResult(false, 0, 'Insufficient data');

    // Find a recent breakout (price moved > buffer from previous swing high/low)
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    if (Math.abs(last.close - prev.close) < break_buffer_ticks) return this.createResult(false, 0, 'No breakout');

    // Check for retest in following bars
    const recent = candles.slice(-retest_bars - 1, -1);
    const retest = recent.some(c => Math.abs(c.close - prev.close) <= break_buffer_ticks);
    if (retest) return this.createResult(true, 0.9, 'Break and retest confirmed');

    return this.createResult(false, 0, 'Break found but no retest');
  }
}
