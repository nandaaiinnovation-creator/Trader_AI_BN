import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class WickRejectionRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['wick_threshold_pct', 'use_vwap_or_bb']);
    const { wick_threshold_pct, use_vwap_or_bb } = this.config.params;

    const candles = context.candles;
    const last = candles[candles.length - 1];
    const body = Math.abs(last.close - last.open);
    const upperWick = last.high - Math.max(last.open, last.close);
    const lowerWick = Math.min(last.open, last.close) - last.low;

    if (upperWick / (body || 1) > wick_threshold_pct && last.close < (last.vwap || last.open)) {
      return this.createResult(true, 0.9, 'Upper wick rejection at VWAP/band');
    }
    if (lowerWick / (body || 1) > wick_threshold_pct && last.close > (last.vwap || last.open)) {
      return this.createResult(true, 0.9, 'Lower wick rejection at VWAP/band');
    }

    return this.createResult(false, 0, 'No wick rejection');
  }
}
