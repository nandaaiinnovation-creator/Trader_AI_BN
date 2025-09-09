import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class VWAPBiasRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['vwap_dev_sigma']);
    const { vwap_dev_sigma } = this.config.params;

    // Get current VWAP and price
    const currentCandle = context.candles[context.candles.length - 1];
    const currentVwap = currentCandle.vwap;
    const currentClose = currentCandle.close;

    if (!currentVwap) {
      return this.createResult(false, 0, 'VWAP data not available');
    }

    // Calculate VWAP deviation bands
    const deviation = context.marketState.atr * vwap_dev_sigma;
    const upperBand = currentVwap + deviation;
    const lowerBand = currentVwap - deviation;

    // Calculate distance from VWAP as percentage
    const vwapDist = Math.abs(currentClose - currentVwap) / currentVwap;
    const normalizedStrength = Math.min(vwapDist / 0.01, 1); // Cap at 1% distance for full strength

    if (currentClose > upperBand) {
      return this.createResult(
        true,
        normalizedStrength,
        `Bullish VWAP bias: Price ${currentClose.toFixed(2)} above VWAP ${currentVwap.toFixed(2)} + ${deviation.toFixed(2)}`
      );
    }

    if (currentClose < lowerBand) {
      return this.createResult(
        true,
        normalizedStrength,
        `Bearish VWAP bias: Price ${currentClose.toFixed(2)} below VWAP ${currentVwap.toFixed(2)} - ${deviation.toFixed(2)}`
      );
    }

    return this.createResult(false, 0, 'Price within VWAP bands');
  }
}
