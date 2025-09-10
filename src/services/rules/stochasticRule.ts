import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { stochRsi } from '../../utils/indicators';

export default class StochasticRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['stoch_rsi_period', 'k_period', 'd_period', 'oversold', 'overbought']);
    const { stoch_rsi_period, k_period, d_period, oversold, overbought } = this.config.params;

    const closes = context.candles.map(c => c.close);
    const st = stochRsi(closes, stoch_rsi_period, stoch_rsi_period, k_period, d_period);
    if (!st || st.length === 0) return this.createResult(false, 0, 'Insufficient data for Stochastic RSI');

    const last = st[st.length - 1];
    // last expected to be {k, d} shape for some libs; be defensive
    const k = (last as any).k ?? (Array.isArray(last) ? last[0] : (last as any).value ?? last);

    if (k <= oversold) return this.createResult(true, 0.8, 'Stochastic confirmation bullish');
    if (k >= overbought) return this.createResult(true, 0.8, 'Stochastic confirmation bearish');
    return this.createResult(false, 0, 'No stochastic confirmation');
  }
}
