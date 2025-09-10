"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class StochasticRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['stoch_rsi_period', 'k_period', 'd_period', 'oversold', 'overbought']);
        const { stoch_rsi_period, k_period, d_period, oversold, overbought } = this.config.params;
        const closes = context.candles.map(c => c.close);
        const st = (0, indicators_1.stochRsi)(closes, stoch_rsi_period, stoch_rsi_period, k_period, d_period);
        if (!st || st.length === 0)
            return this.createResult(false, 0, 'Insufficient data for Stochastic RSI');
        const last = st[st.length - 1];
        // last expected to be {k, d} shape for some libs; be defensive
        const k = last.k ?? (Array.isArray(last) ? last[0] : last.value ?? last);
        if (k <= oversold)
            return this.createResult(true, 0.8, 'Stochastic confirmation bullish');
        if (k >= overbought)
            return this.createResult(true, 0.8, 'Stochastic confirmation bearish');
        return this.createResult(false, 0, 'No stochastic confirmation');
    }
}
exports.default = StochasticRule;
