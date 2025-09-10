import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

interface TimeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  expectedBehavior: 'volatile' | 'trending' | 'reversal' | 'consolidation';
}

export default class TimePatternRule extends BaseRule {
  private readonly timeWindows: TimeWindow[] = [
    { startHour: 9, startMinute: 15, endHour: 9, endMinute: 30, expectedBehavior: 'volatile' },
    { startHour: 9, startMinute: 30, endHour: 10, endMinute: 30, expectedBehavior: 'trending' },
    { startHour: 10, startMinute: 30, endHour: 12, endMinute: 0, expectedBehavior: 'consolidation' },
    { startHour: 12, startMinute: 0, endHour: 13, endMinute: 30, expectedBehavior: 'consolidation' },
    { startHour: 13, startMinute: 30, endHour: 14, endMinute: 30, expectedBehavior: 'trending' },
    { startHour: 14, startMinute: 30, endHour: 15, endMinute: 15, expectedBehavior: 'reversal' }
  ];

  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['volatility_threshold', 'trend_threshold', 'reversal_threshold']);
    const { volatility_threshold, trend_threshold, reversal_threshold } = this.config.params;

    const candles = context.candles;
    if (candles.length < 15) {
      return this.createResult(false, 0, 'Insufficient data for time analysis');
    }

    // Get current time window
    const currentTime = new Date(candles[candles.length - 1].timestamp);
    const currentWindow = this.getCurrentTimeWindow(currentTime);
    if (!currentWindow) {
      return this.createResult(false, 0, 'Outside regular trading hours');
    }

    // Calculate recent price action metrics
    const metrics = this.calculateTimeWindowMetrics(candles.slice(-15));

    // Evaluate based on time window expectation
    switch (currentWindow.expectedBehavior) {
      case 'volatile':
        if (metrics.volatility > volatility_threshold) {
          const strength = Math.min(metrics.volatility / (volatility_threshold * 2), 1);
          return this.createResult(
            true,
            strength,
            `High volatility aligned with opening window: ${(metrics.volatility * 100).toFixed(2)}%`
          );
        }
        break;

      case 'trending':
        if (Math.abs(metrics.trendStrength) > trend_threshold) {
          const strength = Math.min(Math.abs(metrics.trendStrength) / (trend_threshold * 2), 1);
          const direction = metrics.trendStrength > 0 ? 'bullish' : 'bearish';
          return this.createResult(
            true,
            strength,
            `${direction} trend in trending window: ${(metrics.trendStrength * 100).toFixed(2)}%`
          );
        }
        break;

      case 'reversal':
        if (metrics.reversalScore > reversal_threshold) {
          const strength = Math.min(metrics.reversalScore / (reversal_threshold * 2), 1);
          const direction = metrics.trendStrength > 0 ? 'bullish' : 'bearish';
          return this.createResult(
            true,
            strength,
            `Potential ${direction} reversal in reversal window: Score ${(metrics.reversalScore * 100).toFixed(2)}%`
          );
        }
        break;

      case 'consolidation':
        if (metrics.volatility < volatility_threshold / 2) {
          const consolidationQuality = 1 - (metrics.volatility / (volatility_threshold / 2));
          return this.createResult(
            true,
            consolidationQuality,
            `Strong consolidation in expected window: ${(metrics.volatility * 100).toFixed(2)}% volatility`
          );
        }
        break;
    }

    return this.createResult(
      false,
      0,
      `Regular ${currentWindow.expectedBehavior} window activity`
    );
  }

  private getCurrentTimeWindow(time: Date): TimeWindow | null {
    for (const window of this.timeWindows) {
      const start = new Date(time);
      start.setHours(window.startHour, window.startMinute, 0, 0);
      
      const end = new Date(time);
      end.setHours(window.endHour, window.endMinute, 0, 0);

      if (time >= start && time <= end) {
        return window;
      }
    }
    return null;
  }

  private calculateTimeWindowMetrics(candles: any[]) {
    const returns = [];
    let sumReturns = 0;
    let sumSquaredReturns = 0;

    // Calculate returns and basic statistics
    for (let i = 1; i < candles.length; i++) {
      const returnVal = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(returnVal);
      sumReturns += returnVal;
      sumSquaredReturns += returnVal * returnVal;
    }

    const meanReturn = sumReturns / returns.length;
    const volatility = Math.sqrt(sumSquaredReturns / returns.length - meanReturn * meanReturn);

    // Calculate trend strength using linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const prices = candles.map(c => c.close);
    
    for (let i = 0; i < prices.length; i++) {
      sumX += i;
      sumY += prices[i];
      sumXY += i * prices[i];
      sumX2 += i * i;
    }

    const n = prices.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const trendStrength = slope / prices[0];  // Normalize by first price

    // Calculate reversal score
    const firstHalf = returns.slice(0, Math.floor(returns.length / 2));
    const secondHalf = returns.slice(Math.floor(returns.length / 2));
    
    const firstHalfTrend = firstHalf.reduce((sum, val) => sum + val, 0);
    const secondHalfTrend = secondHalf.reduce((sum, val) => sum + val, 0);
    
    const reversalScore = Math.abs(firstHalfTrend) > 0.001 && 
                         Math.sign(firstHalfTrend) !== Math.sign(secondHalfTrend) ?
                         Math.min(Math.abs(secondHalfTrend / firstHalfTrend), 1) : 0;

    return {
      volatility,
      trendStrength,
      reversalScore,
      meanReturn
    };
  }
}
