import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

interface OptionFlow {
  value: number;  // Strike price
  strike: number;
  callOI: number;
  putOI: number;
  callVolume: number;
  putVolume: number;
  callOIChange: number;
  putOIChange: number;
}

export default class OptionFlowRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['strikes_range', 'min_oi_change', 'volume_threshold']);
    const { strikes_range, min_oi_change, volume_threshold } = this.config.params;

    // Get current spot price
    const currentSpot = context.candles[context.candles.length - 1].close;

    // Get option chain data from context
    const optionFlows = this.getRelevantStrikes(context, currentSpot, strikes_range);
    if (!optionFlows || optionFlows.length === 0) {
      return this.createResult(false, 0, 'Option chain data not available');
    }

    // Calculate aggregated option flow metrics
    const metrics = this.calculateFlowMetrics(optionFlows, currentSpot, min_oi_change);

    // Check for significant option activity
    if (metrics.totalVolume < volume_threshold) {
      return this.createResult(false, 0, 'Insufficient option volume');
    }

    // Calculate PCR and its rate of change
  const currentPCR = metrics.totalPutOI / metrics.totalCallOI;
  const _pcrChange = metrics.totalPutOIChange / metrics.totalCallOIChange;
  void _pcrChange;

    // Calculate signal strength based on multiple factors
    const strength = this.calculateSignalStrength(metrics, currentPCR, _pcrChange);

    // Check for bullish signals
    if (metrics.bullishScore > 0.7 && _pcrChange < 0.8) {
      return this.createResult(
        true,
        strength,
        `Bullish option flow: PCR=${currentPCR.toFixed(2)}, Call buildup at ${metrics.maxCallStrike}`
      );
    }

    // Check for bearish signals
    if (metrics.bearishScore > 0.7 && _pcrChange > 1.2) {
      return this.createResult(
        true,
        strength,
        `Bearish option flow: PCR=${currentPCR.toFixed(2)}, Put buildup at ${metrics.maxPutStrike}`
      );
    }

    // Check for potential reversal signals
    if (metrics.reversalScore > 0.8) {
      const direction = metrics.putUnwinding > metrics.callUnwinding ? 'bullish' : 'bearish';
      return this.createResult(
        true,
        strength * 0.8,
        `Potential ${direction} reversal: Significant option unwinding detected`
      );
    }

    return this.createResult(false, 0, 'No significant option flow signals');
  }

  private getRelevantStrikes(
    context: RuleContext,
    currentSpot: number,
    strikeRange: number
  ): OptionFlow[] {
    // In real implementation, this would come from context.optionChain
    // Here we're simulating with basic data
    const state = context.marketState;
    if (!state.optionChain) return [];

    // Normalize optionChain items to OptionFlow shape if possible
    const mapped: OptionFlow[] = (state.optionChain || []).map((s: any) => ({
      value: s.value ?? s.strike ?? 0,
      strike: s.strike ?? s.value ?? 0,
      callOI: s.callOI ?? s.call_oi ?? 0,
      putOI: s.putOI ?? s.put_oi ?? 0,
      callVolume: s.callVolume ?? s.call_volume ?? 0,
      putVolume: s.putVolume ?? s.put_volume ?? 0,
      callOIChange: s.callOIChange ?? s.call_oi_change ?? 0,
      putOIChange: s.putOIChange ?? s.put_oi_change ?? 0
    }));

    return mapped.filter(strike => Math.abs(strike.value - currentSpot) <= strikeRange * currentSpot);
  }

  private calculateFlowMetrics(
    flows: OptionFlow[],
    currentSpot: number,
    minOIChange: number
  ) {
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallOIChange = 0;
    let totalPutOIChange = 0;
    let totalVolume = 0;
    let bullishScore = 0;
    let bearishScore = 0;
    let callUnwinding = 0;
    let putUnwinding = 0;
    let maxCallStrike = 0;
    let maxPutStrike = 0;
    let maxCallOIChange = 0;
    let maxPutOIChange = 0;

    flows.forEach(flow => {
      // Aggregate OI and volume
      totalCallOI += flow.callOI;
      totalPutOI += flow.putOI;
      totalCallOIChange += flow.callOIChange;
      totalPutOIChange += flow.putOIChange;
      totalVolume += flow.callVolume + flow.putVolume;

      // Track maximum OI changes
      if (flow.callOIChange > maxCallOIChange) {
        maxCallOIChange = flow.callOIChange;
        maxCallStrike = flow.strike;
      }
      if (flow.putOIChange > maxPutOIChange) {
        maxPutOIChange = flow.putOIChange;
        maxPutStrike = flow.strike;
      }

      // Calculate unwinding
      if (flow.callOIChange < -minOIChange) {
        callUnwinding += Math.abs(flow.callOIChange);
      }
      if (flow.putOIChange < -minOIChange) {
        putUnwinding += Math.abs(flow.putOIChange);
      }

      // Calculate directional scores
      if (flow.strike > currentSpot) {
        // OTM calls
        if (flow.callOIChange > minOIChange) {
          bullishScore += flow.callOIChange / totalCallOI;
        }
        // OTM puts
        if (flow.putOIChange > minOIChange) {
          bearishScore += flow.putOIChange / totalPutOI;
        }
      } else {
        // ITM puts
        if (flow.putOIChange > minOIChange) {
          bearishScore += flow.putOIChange / totalPutOI * 1.5; // Weight ITM more
        }
        // ITM calls
        if (flow.callOIChange > minOIChange) {
          bullishScore += flow.callOIChange / totalCallOI * 1.5;
        }
      }
    });

    const reversalScore = Math.max(
      callUnwinding / totalCallOI,
      putUnwinding / totalPutOI
    );

    return {
      totalCallOI,
      totalPutOI,
      totalCallOIChange,
      totalPutOIChange,
      totalVolume,
      bullishScore,
      bearishScore,
      reversalScore,
      callUnwinding,
      putUnwinding,
      maxCallStrike,
      maxPutStrike
    };
  }

  private calculateSignalStrength(
    metrics: any,
    currentPCR: number,
    _pcrChange: number
  ): number {
    // Combine multiple factors for signal strength:
    // 1. Absolute score (bullish or bearish)
    const absoluteScore = Math.max(metrics.bullishScore, metrics.bearishScore);

    // 2. PCR extremes (very high or very low PCR)
    const pcrScore = Math.min(Math.abs(currentPCR - 1) / 2, 1);

    // 3. Volume significance
    const volumeScore = Math.min(metrics.totalVolume / 100000, 1); // Normalize to large volume

    // 4. OI change significance
    const oiChangeScore = Math.min(
      (Math.abs(metrics.totalCallOIChange) + Math.abs(metrics.totalPutOIChange)) / 50000,
      1
    );

    // Weighted average of all factors
    return Math.min(
      (absoluteScore * 0.4 + pcrScore * 0.2 + volumeScore * 0.2 + oiChangeScore * 0.2),
      1
    );
  }
}
