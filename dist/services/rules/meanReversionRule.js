"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const bollinger_1 = require("../../utils/indicators/bollinger");
const atr_1 = require("../../utils/indicators/atr");
class MeanReversionRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['bb_period', 'bb_std', 'min_vol_ratio', 'mean_revert_bars']);
        const { bb_period, bb_std, min_vol_ratio, mean_revert_bars } = this.config.params;
        const closes = context.candles.map(c => c.close);
        const highs = context.candles.map(c => c.high);
        const lows = context.candles.map(c => c.low);
        // Calculate Bollinger Bands
        const bb = (0, bollinger_1.bollingerBands)(closes, bb_period, bb_std);
        if (!bb.upper || !bb.lower || !bb.middle) {
            return this.createResult(false, 0, 'Insufficient data for BB calculation');
        }
        // Get current values
        const currentClose = closes[closes.length - 1];
        const currentUpper = bb.upper[bb.upper.length - 1];
        const currentLower = bb.lower[bb.lower.length - 1];
        const currentMiddle = bb.middle[bb.middle.length - 1];
        // Calculate ATR for volatility context
        const atrValues = (0, atr_1.atr)(highs, lows, closes);
        const currentATR = atrValues[atrValues.length - 1];
        const expectedVolatility = currentATR / currentClose;
        // Check if volatility is sufficient
        if (expectedVolatility < min_vol_ratio) {
            return this.createResult(false, 0, 'Insufficient volatility for mean reversion');
        }
        // Check recent price action for mean reversion setup
        const recentCloses = closes.slice(-mean_revert_bars);
        const recentHighs = highs.slice(-mean_revert_bars);
        const recentLows = lows.slice(-mean_revert_bars);
        // Calculate distance from mean (middle BB)
        const distanceFromMean = Math.abs(currentClose - currentMiddle) / currentMiddle;
        const normalizedStrength = Math.min(distanceFromMean / 0.02, 1); // Cap at 2% distance
        // Check for oversold condition
        if (currentClose < currentLower) {
            const lowestLow = Math.min(...recentLows);
            if (currentClose <= lowestLow) {
                return this.createResult(true, normalizedStrength, `Bullish mean reversion: Price ${(distanceFromMean * 100).toFixed(2)}% below mean with ${(expectedVolatility * 100).toFixed(2)}% volatility`);
            }
        }
        // Check for overbought condition
        if (currentClose > currentUpper) {
            const highestHigh = Math.max(...recentHighs);
            if (currentClose >= highestHigh) {
                return this.createResult(true, normalizedStrength, `Bearish mean reversion: Price ${(distanceFromMean * 100).toFixed(2)}% above mean with ${(expectedVolatility * 100).toFixed(2)}% volatility`);
            }
        }
        return this.createResult(false, 0, 'No mean reversion setup detected');
    }
}
exports.default = MeanReversionRule;
