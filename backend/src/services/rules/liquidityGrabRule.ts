import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class LiquidityGrabRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['sweep_buffer_ticks', 'confirm_close_within', 'lookback']);
    const { sweep_buffer_ticks, confirm_close_within, lookback } = this.config.params;

    const candles = context.candles;
    if (candles.length < lookback + confirm_close_within + 1) {
      return this.createResult(false, 0, 'Insufficient data for liquidity grab analysis');
    }

    const tickSize = (context.marketState.atr || 1) / 10; // approximate
    const buffer = sweep_buffer_ticks * tickSize;

    // Look for prior high/low in lookback window
    const window = candles.slice(-lookback - confirm_close_within - 1, -confirm_close_within - 1);
    const priorHigh = Math.max(...window.map(c => c.high));
    const priorLow = Math.min(...window.map(c => c.low));

    // Candidate sweep candle is the one immediately before the confirmation window
    const sweepCandle = candles[candles.length - confirm_close_within - 2];

    // Check for sweep above prior high
    if (sweepCandle.high >= priorHigh + buffer) {
      // Check for snap back inside within confirm_close_within bars
      const confirmSlice = candles.slice(-confirm_close_within);
      const snappedBack = confirmSlice.some(c => c.close <= priorHigh);
      if (snappedBack) {
        return this.createResult(true, 1, `Liquidity grab detected: sweep above ${priorHigh.toFixed(2)} then closed back inside within ${confirm_close_within} bars`);
      }
    }

    // Check for sweep below prior low
    if (sweepCandle.low <= priorLow - buffer) {
      const confirmSlice = candles.slice(-confirm_close_within);
      const snappedBack = confirmSlice.some(c => c.close >= priorLow);
      if (snappedBack) {
        return this.createResult(true, 1, `Liquidity grab detected: sweep below ${priorLow.toFixed(2)} then closed back inside within ${confirm_close_within} bars`);
      }
    }

    return this.createResult(false, 0, 'No liquidity grab detected');
  }
}
