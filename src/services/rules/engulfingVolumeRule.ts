import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class EngulfingVolumeRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['min_volume_mult', 'pivot_window']);
    const { min_volume_mult, pivot_window } = this.config.params;

    const candles = context.candles;
    if (candles.length < pivot_window + 2) return this.createResult(false, 0, 'Insufficient data');

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    const isBullishEngulf = last.open < last.close && last.open <= prev.close && last.close >= prev.open;
    const isBearishEngulf = last.open > last.close && last.open >= prev.close && last.close <= prev.open;

    const avgVol = candles.slice(-pivot_window - 1, -1).reduce((s, c) => s + c.volume, 0) / pivot_window;
    if (isBullishEngulf && last.volume > avgVol * min_volume_mult) return this.createResult(true, 1, 'Bullish engulfing with volume');
    if (isBearishEngulf && last.volume > avgVol * min_volume_mult) return this.createResult(true, 1, 'Bearish engulfing with volume');

    return this.createResult(false, 0, 'No engulfing+volume');
  }
}
