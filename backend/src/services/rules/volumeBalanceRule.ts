import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { sma } from '../../utils/indicators';

export default class VolumeBalanceRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['volume_ma_period', 'obv_threshold', 'price_confirm_pct']);
    const { volume_ma_period, obv_threshold, price_confirm_pct } = this.config.params;

    const candles = context.candles;
    if (candles.length < volume_ma_period) {
      return this.createResult(false, 0, 'Insufficient data for volume balance analysis');
    }

    // Calculate On-Balance Volume (OBV)
    const obv: number[] = [0]; // Start with 0 as base
    for (let i = 1; i < candles.length; i++) {
      const currentClose = candles[i].close;
      const previousClose = candles[i - 1].close;
      const currentVolume = candles[i].volume;

      if (currentClose > previousClose) {
        obv.push(obv[obv.length - 1] + currentVolume);
      } else if (currentClose < previousClose) {
        obv.push(obv[obv.length - 1] - currentVolume);
      } else {
        obv.push(obv[obv.length - 1]);
      }
    }

    // Calculate OBV moving average
    const obvMA = sma(obv, volume_ma_period);
    if (obvMA.length < 2) {
      return this.createResult(false, 0, 'Insufficient data points for OBV analysis');
    }

    // Calculate recent OBV change
    const currentOBV = obv[obv.length - 1];
    const previousOBV = obv[obv.length - 2];
    const obvChange = (currentOBV - previousOBV) / Math.abs(previousOBV) * 100;

    // Calculate recent price change
    const currentPrice = candles[candles.length - 1].close;
    const previousPrice = candles[candles.length - 2].close;
    const priceChange = (currentPrice - previousPrice) / previousPrice * 100;

    // Check for volume/price divergence
    if (Math.abs(obvChange) > obv_threshold) {
      // Volume surge without price confirmation (potential accumulation/distribution)
      if (Math.abs(priceChange) < price_confirm_pct) {
        const strength = Math.min(Math.abs(obvChange) / (obv_threshold * 2), 1);
        
        if (obvChange > 0) {
          return this.createResult(
            true,
            strength,
            `Potential accumulation: +${obvChange.toFixed(1)}% OBV change with ${priceChange.toFixed(2)}% price change`
          );
        } else {
          return this.createResult(
            true,
            strength,
            `Potential distribution: ${obvChange.toFixed(1)}% OBV change with ${priceChange.toFixed(2)}% price change`
          );
        }
      }
      
      // Strong volume confirmation of price move
      if (Math.sign(obvChange) === Math.sign(priceChange)) {
        const strength = Math.min((Math.abs(obvChange) * Math.abs(priceChange)) / (obv_threshold * price_confirm_pct), 1);
        
        if (obvChange > 0) {
          return this.createResult(
            true,
            strength,
            `Strong bullish volume: +${obvChange.toFixed(1)}% OBV confirms +${priceChange.toFixed(2)}% price move`
          );
        } else {
          return this.createResult(
            true,
            strength,
            `Strong bearish volume: ${obvChange.toFixed(1)}% OBV confirms ${priceChange.toFixed(2)}% price move`
          );
        }
      }
    }

    return this.createResult(false, 0, 'No significant volume imbalance detected');
  }
}
