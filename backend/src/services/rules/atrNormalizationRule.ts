import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { atr } from '../../utils/indicators';

export default class ATRNormalizationRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['atr_period', 'max_atr_mult']);
    const { atr_period, max_atr_mult } = this.config.params;

    const highs = context.candles.map(c => c.high);
    const lows = context.candles.map(c => c.low);
    const closes = context.candles.map(c => c.close);
    const atrSeries = atr(highs, lows, closes, atr_period);
    if (!atrSeries || atrSeries.length === 0) return this.createResult(false, 0, 'Insufficient ATR data');

    const lastAtr = atrSeries[atrSeries.length - 1];
    if (lastAtr > max_atr_mult * (closes[closes.length - 1] || 1)) {
      return this.createResult(false, 0, 'Volatility too high (ATR normalized)');
    }

    return this.createResult(false, 0, 'ATR within bounds');
  }
}
