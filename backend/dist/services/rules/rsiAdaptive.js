"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class RSIAdaptiveRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['rsi_len', 'upper', 'lower', 'cooldown_bars']);
        const { rsi_len, upper, lower, cooldown_bars } = this.config.params;
        const closes = context.candles.map(c => c.close);
        const rsiValues = (0, indicators_1.rsi)(closes, rsi_len);
        if (rsiValues.length < cooldown_bars) {
            return this.createResult(false, 0, 'Not enough data for RSI calculation');
        }
        // Get current RSI and previous values for cooldown check
        const currentRsi = rsiValues[rsiValues.length - 1];
        const recentRsi = rsiValues.slice(-cooldown_bars);
        // Adapt thresholds based on regime
        let adjustedUpper = upper;
        let adjustedLower = lower;
        switch (context.regime) {
            case 'TRENDING':
                // More sensitive in trending markets
                adjustedUpper -= 5;
                adjustedLower += 5;
                break;
            case 'RANGE':
                // Use standard levels
                break;
            case 'MEAN_REVERT':
                // More extreme levels in mean reversion
                adjustedUpper += 5;
                adjustedLower -= 5;
                break;
        }
        // Check for recent signals to enforce cooldown
        const recentBullish = recentRsi.some(r => r < adjustedLower);
        const recentBearish = recentRsi.some(r => r > adjustedUpper);
        // Calculate signal strength based on distance from threshold
        const normalizedStrength = (val, threshold) => Math.min(Math.abs(val - threshold) / 10, 1); // 10 points from threshold = full strength
        if (currentRsi > adjustedUpper && !recentBearish) {
            return this.createResult(true, normalizedStrength(currentRsi, adjustedUpper), `Bearish RSI: ${currentRsi.toFixed(2)} above ${adjustedUpper} in ${context.regime} regime`);
        }
        if (currentRsi < adjustedLower && !recentBullish) {
            return this.createResult(true, normalizedStrength(currentRsi, adjustedLower), `Bullish RSI: ${currentRsi.toFixed(2)} below ${adjustedLower} in ${context.regime} regime`);
        }
        return this.createResult(false, 0, 'RSI within neutral zone');
    }
}
exports.default = RSIAdaptiveRule;
