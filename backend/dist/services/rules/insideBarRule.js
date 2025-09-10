"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class InsideBarRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['lookback', 'breakout_confirm_ticks']);
        const { lookback, breakout_confirm_ticks } = this.config.params;
        const candles = context.candles;
        if (candles.length < lookback + 2)
            return this.createResult(false, 0, 'Insufficient history for inside-bar');
        const current = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        // inside bar definition
        if (current.high <= prev.high && current.low >= prev.low) {
            // Check breakout in following ticks (we only have candles, so approximate using recent closes)
            const recent = candles.slice(-1 - breakout_confirm_ticks);
            const breakoutBull = recent.some(c => c.close > prev.high);
            const breakoutBear = recent.some(c => c.close < prev.low);
            if (breakoutBull)
                return this.createResult(true, 1, 'Inside-bar bullish breakout');
            if (breakoutBear)
                return this.createResult(true, 1, 'Inside-bar bearish breakout');
            return this.createResult(false, 0, 'Inside bar present but no breakout yet');
        }
        return this.createResult(false, 0, 'No inside bar');
    }
}
exports.default = InsideBarRule;
