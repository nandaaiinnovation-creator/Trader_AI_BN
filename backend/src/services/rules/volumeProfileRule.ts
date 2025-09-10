import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

interface VolumeLevel {
  price: number;
  volume: number;
  cumVolume: number;
}

export default class VolumeProfileRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['profile_periods', 'price_levels', 'vol_threshold_pct']);
    const { profile_periods, price_levels, vol_threshold_pct } = this.config.params;

    const recentCandles = context.candles.slice(-profile_periods);
    const currentPrice = recentCandles[recentCandles.length - 1].close;

    // Build volume profile
    const profile = this.buildVolumeProfile(recentCandles, price_levels);
    if (!profile.length) {
      return this.createResult(false, 0, 'Insufficient data for volume profile');
    }

    // Find significant volume levels
    const totalVolume = profile.reduce((sum, level) => sum + level.volume, 0);
    const volumeThreshold = (totalVolume / profile.length) * (vol_threshold_pct / 100);

    const significantLevels = profile.filter(level => level.volume > volumeThreshold)
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice));

    if (!significantLevels.length) {
      return this.createResult(false, 0, 'No significant volume levels found');
    }

    // Find nearest significant level
    const nearestLevel = significantLevels[0];
    const priceDiff = (currentPrice - nearestLevel.price) / nearestLevel.price;
    const volumeStrength = nearestLevel.volume / volumeThreshold;
    
    // Normalize signal strength based on price distance and volume significance
    const strength = Math.min(
      (volumeStrength * (1 - Math.abs(priceDiff) * 100)) / 2,
      1
    );

    if (Math.abs(priceDiff) < 0.005) { // Within 0.5% of significant level
      if (priceDiff > 0) {
        return this.createResult(
          true,
          strength,
          `Bearish volume node: Heavy volume resistance at ${nearestLevel.price.toFixed(2)} with ${(volumeStrength).toFixed(2)}x threshold volume`
        );
      } else {
        return this.createResult(
          true,
          strength,
          `Bullish volume node: Heavy volume support at ${nearestLevel.price.toFixed(2)} with ${(volumeStrength).toFixed(2)}x threshold volume`
        );
      }
    }

    return this.createResult(false, 0, 'Price not near significant volume level');
  }

  private buildVolumeProfile(candles: any[], levels: number): VolumeLevel[] {
    if (candles.length === 0) return [];

    // Find price range
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const maxPrice = Math.max(...highs);
    const minPrice = Math.min(...lows);
    const priceStep = (maxPrice - minPrice) / levels;

    // Initialize price levels
    const volumeLevels: VolumeLevel[] = [];
    for (let i = 0; i < levels; i++) {
      const levelPrice = minPrice + (i * priceStep);
      volumeLevels.push({
        price: levelPrice,
        volume: 0,
        cumVolume: 0
      });
    }

    // Distribute volume across price levels
    candles.forEach(candle => {
      const candleRange = candle.high - candle.low;
      const volumePerPrice = candle.volume / candleRange;

      volumeLevels.forEach(level => {
        if (level.price >= candle.low && level.price <= candle.high) {
          level.volume += volumePerPrice * priceStep;
        }
      });
    });

    // Calculate cumulative volume
    let cumVolume = 0;
    volumeLevels.forEach(level => {
      cumVolume += level.volume;
      level.cumVolume = cumVolume;
    });

    return volumeLevels;
  }
}
