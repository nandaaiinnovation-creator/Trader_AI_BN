"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class SwingBreakRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['lookback_swing', 'close_buffer_ticks']);
        const { lookback_swing, close_buffer_ticks } = this.config.params;
        const highs = context.candles.map(c => c.high);
        const lows = context.candles.map(c => c.low);
        const closes = context.candles.map(c => c.close);
        // Find recent swing points
        const { highs: highPivots, lows: lowPivots } = (0, indicators_1.findPivots)(closes, lookback_swing);
        if (highPivots.length === 0 || lowPivots.length === 0) {
            return this.createResult(false, 0, 'No clear swing points found');
        }
        // Get most recent swing levels
        const lastSwingHigh = Math.max(...highPivots.slice(-3).map(i => highs[i]));
        const lastSwingLow = Math.min(...lowPivots.slice(-3).map(i => lows[i]));
        // Current close and tick buffer
        const currentClose = closes[closes.length - 1];
        const tickSize = context.marketState.atr / 10; // Approximate tick size from ATR
        const buffer = tickSize * close_buffer_ticks;
        // Check for breaks with confirmation
        if (currentClose > lastSwingHigh + buffer) {
            const strength = (currentClose - lastSwingHigh) / (lastSwingHigh * 0.01); // Normalize by 1%
            return this.createResult(true, Math.min(strength, 1), `Bullish swing break: Close ${currentClose.toFixed(2)} above swing high ${lastSwingHigh.toFixed(2)}`);
        }
        if (currentClose < lastSwingLow - buffer) {
            const strength = (lastSwingLow - currentClose) / (lastSwingLow * 0.01); // Normalize by 1%
            return this.createResult(true, Math.min(strength, 1), `Bearish swing break: Close ${currentClose.toFixed(2)} below swing low ${lastSwingLow.toFixed(2)}`);
        }
        return this.createResult(false, 0, 'No swing breaks detected');
    }
}
exports.default = SwingBreakRule;
