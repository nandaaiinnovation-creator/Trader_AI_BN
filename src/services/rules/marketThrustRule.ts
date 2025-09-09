import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { atr } from '../../utils/indicators';

interface PriceThrust {
  magnitude: number;
  volume: number;
}

export default class MarketThrustRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['thrust_window', 'volume_mult', 'min_thrusts']);
    const { thrust_window, volume_mult, min_thrusts } = this.config.params;

    const candles = context.candles;
    if (candles.length < thrust_window * 2) {
      return this.createResult(false, 0, 'Insufficient data for thrust analysis');
    }

    // Calculate ATR for volatility context
    const atrValues = atr(
      candles.map(c => c.high),
      candles.map(c => c.low),
      candles.map(c => c.close)
    );
    const currentAtr = atrValues[atrValues.length - 1];

    // Calculate baseline volume
    const baselineVolume = candles
      .slice(-20)
      .reduce((sum, candle) => sum + candle.volume, 0) / 20;

    // Find thrusts in the window
    const bullishThrusts: PriceThrust[] = [];
    const bearishThrusts: PriceThrust[] = [];
    
    for (let i = candles.length - thrust_window; i < candles.length; i++) {
      const candle = candles[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const isHighVolume = candle.volume > baselineVolume * volume_mult;

      if (bodySize > currentAtr * 0.7 && isHighVolume) { // Significant thrust = 70% of ATR
        const thrust: PriceThrust = {
          magnitude: bodySize / currentAtr,
          volume: candle.volume / baselineVolume
        };

        if (candle.close > candle.open) {
          bullishThrusts.push(thrust);
        } else {
          bearishThrusts.push(thrust);
        }
      }
    }

    // Check for significant thrusts in either direction
    if (bullishThrusts.length >= min_thrusts) {
      const avgMagnitude = bullishThrusts.reduce((sum, t) => sum + t.magnitude, 0) / bullishThrusts.length;
      const avgVolume = bullishThrusts.reduce((sum, t) => sum + t.volume, 0) / bullishThrusts.length;
      const strength = Math.min((avgMagnitude * avgVolume) / 4, 1); // Normalize combined score

      return this.createResult(
        true,
        strength,
        `Bullish thrust pattern: ${bullishThrusts.length} thrusts, avg ${(avgMagnitude * 100).toFixed(1)}% ATR with ${avgVolume.toFixed(1)}x volume`
      );
    }

    if (bearishThrusts.length >= min_thrusts) {
      const avgMagnitude = bearishThrusts.reduce((sum, t) => sum + t.magnitude, 0) / bearishThrusts.length;
      const avgVolume = bearishThrusts.reduce((sum, t) => sum + t.volume, 0) / bearishThrusts.length;
      const strength = Math.min((avgMagnitude * avgVolume) / 4, 1);

      return this.createResult(
        true,
        strength,
        `Bearish thrust pattern: ${bearishThrusts.length} thrusts, avg ${(avgMagnitude * 100).toFixed(1)}% ATR with ${avgVolume.toFixed(1)}x volume`
      );
    }

    return this.createResult(false, 0, 'No significant thrust pattern detected');
  }
}
