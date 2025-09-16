import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { findPivots, linearRegression } from '../../utils/indicators';

interface SRLevel {
  price: number;
  strength: number;
  type: 'support' | 'resistance';
  touches: number;
}

export default class DynamicSRRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['sr_lookback', 'touch_threshold', 'proximity_pct']);
  const { sr_lookback, proximity_pct } = this.config.params;
  // touch_threshold reserved for future use
  const _touch_threshold = (this.config.params as any).touch_threshold;
  void _touch_threshold;

    const candles = context.candles;
    if (candles.length < sr_lookback) {
      return this.createResult(false, 0, 'Insufficient data for S/R analysis');
    }

    // Get current price
    const currentPrice = candles[candles.length - 1].close;
    const currentHigh = candles[candles.length - 1].high;
    const currentLow = candles[candles.length - 1].low;

    // Find support and resistance levels
    const levels = this.identifySRLevels(candles.slice(-sr_lookback));

    // Filter for relevant levels
    const proximityThreshold = currentPrice * (proximity_pct / 100);
    const nearbyLevels = levels.filter(level => 
      Math.abs(level.price - currentPrice) <= proximityThreshold
    );

    if (nearbyLevels.length === 0) {
      return this.createResult(false, 0, 'No nearby S/R levels');
    }

    // Sort by strength and proximity
    nearbyLevels.sort((a, b) => {
      const aScore = a.strength * (1 - Math.abs(a.price - currentPrice) / proximityThreshold);
      const bScore = b.strength * (1 - Math.abs(b.price - currentPrice) / proximityThreshold);
      return bScore - aScore;
    });

    const mostSignificantLevel = nearbyLevels[0];

    // Check for level tests/breaks
    if (mostSignificantLevel.type === 'resistance' && 
        currentHigh > mostSignificantLevel.price) {
      // Resistance break
      const breakoutStrength = (currentPrice - mostSignificantLevel.price) / proximityThreshold;
      return this.createResult(
        true,
        Math.min(breakoutStrength, 1),
        `Breaking resistance: ${mostSignificantLevel.price.toFixed(2)} with ${mostSignificantLevel.touches} touches`
      );
    }

    if (mostSignificantLevel.type === 'support' && 
        currentLow < mostSignificantLevel.price) {
      // Support break
      const breakoutStrength = (mostSignificantLevel.price - currentPrice) / proximityThreshold;
      return this.createResult(
        true,
        Math.min(breakoutStrength, 1),
        `Breaking support: ${mostSignificantLevel.price.toFixed(2)} with ${mostSignificantLevel.touches} touches`
      );
    }

    // Check for tests of levels
    const nearLevel = nearbyLevels.find(level => {
      const distance = Math.abs(currentPrice - level.price);
      return distance < proximityThreshold * 0.3; // Within 30% of proximity threshold
    });

    if (nearLevel) {
      const testStrength = 1 - (Math.abs(currentPrice - nearLevel.price) / (proximityThreshold * 0.3));
      return this.createResult(
        true,
        testStrength,
        `Testing ${nearLevel.type}: ${nearLevel.price.toFixed(2)} (strength: ${(nearLevel.strength * 100).toFixed(1)}%)`
      );
    }

    return this.createResult(
      false,
      0,
      `Nearest ${mostSignificantLevel.type}: ${mostSignificantLevel.price.toFixed(2)}`
    );
  }

  private identifySRLevels(candles: any[]): SRLevel[] {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  void closes;

  // Find pivot points using highs and lows so flat highs/lows are captured as pivots
  const { highs: highPivots, lows: lowPivots } = findPivots(highs, 5);
  // lowPivots is intentionally unused because we compute combinedLowPivots separately
  const _lowPivots = lowPivots;
  void _lowPivots;
  // For bottom pivots use lows array
  const lowPivotResult = findPivots(lows, 5);
  // merge low pivots into lowPivots if needed
  const combinedLowPivots = lowPivotResult.lows;

    // Initialize potential levels
    const potentialLevels: Map<number, SRLevel> = new Map();

    // Process highs for resistance
    highPivots.forEach(i => {
      const price = Math.round(highs[i] / 10) * 10; // Round to nearest 10
      if (!potentialLevels.has(price)) {
        potentialLevels.set(price, {
          price,
          strength: 0,
          type: 'resistance',
          touches: 1
        });
      } else {
        const level = potentialLevels.get(price)!;
        level.touches++;
        level.strength = this.calculateLevelStrength(level.touches, i / candles.length);
      }
    });

    // Process lows for support
    combinedLowPivots.forEach(i => {
      const price = Math.round(lows[i] / 10) * 10; // Round to nearest 10
      if (!potentialLevels.has(price)) {
        potentialLevels.set(price, {
          price,
          strength: 0,
          type: 'support',
          touches: 1
        });
      } else {
        const level = potentialLevels.get(price)!;
        level.touches++;
        level.strength = this.calculateLevelStrength(level.touches, i / candles.length);
      }
    });

    // Calculate regression zones
    const srLevels = Array.from(potentialLevels.values());
    srLevels.forEach(level => {
      // Find all touches within 0.1% of the level
      const touches = candles.filter(c => 
        Math.abs(c.high - level.price) / level.price < 0.001 ||
        Math.abs(c.low - level.price) / level.price < 0.001
      );

      if (touches.length >= 3) {
        const prices = touches.map(c => level.type === 'resistance' ? c.high : c.low);
        const { slope } = linearRegression(prices, prices.length);
        
        // Adjust strength based on regression quality
        level.strength *= 0.5;
        
        // Adjust type if level is sloping significantly
        if (Math.abs(slope) > 0.001) {
          level.strength *= 0.8; // Reduce strength of sloping levels
        }
      }
    });

    return srLevels.filter(level => level.touches >= 2);
  }

  private calculateLevelStrength(touches: number, recency: number): number {
    // Base strength from number of touches (diminishing returns after 5 touches)
    const touchStrength = Math.min(touches / 5, 1);
    
    // Recency factor (more recent levels are stronger)
    const recencyStrength = 0.5 + 0.5 * recency;
    
    // Combine factors
    return (touchStrength * 0.7 + recencyStrength * 0.3);
  }
}
