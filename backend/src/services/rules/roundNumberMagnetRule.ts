import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class RoundNumberMagnetRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['round_num_step', 'tolerance_ticks']);
    const { round_num_step, tolerance_ticks } = this.config.params;

    const candles = context.candles;
    if (candles.length === 0) {
      return this.createResult(false, 0, 'No candle data');
    }

    const currentPrice = candles[candles.length - 1].close;
    const tickSize = (context.marketState.tickSize || (context.marketState.atr || 1) / 10);

    const nearestRound = Math.round(currentPrice / round_num_step) * round_num_step;
    const distanceTicks = Math.abs(currentPrice - nearestRound) / tickSize;

    if (distanceTicks <= tolerance_ticks) {
      const strength = 1 - (distanceTicks / Math.max(tolerance_ticks, 1));
      const directionHint = currentPrice > nearestRound ? 'above' : 'below';
      return this.createResult(true, Math.min(Math.max(strength, 0), 1), `Price near round number ${nearestRound} (${directionHint})`);
    }

    return this.createResult(false, 0, `No round-number proximity (${nearestRound})`);
  }
}
