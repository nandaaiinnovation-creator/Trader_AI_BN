"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class TrendlineBreakRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['pivots_window', 'break_buffer', 'min_volume_z']);
        const { pivots_window, break_buffer, min_volume_z } = this.config.params;
        const highs = context.candles.map(c => c.high);
        const lows = context.candles.map(c => c.low);
        const volumes = context.candles.map(c => c.volume);
        const currentClose = context.candles[context.candles.length - 1].close;
        const currentVolume = volumes[volumes.length - 1];
        // Find pivot points
        const { highs: highPivots, lows: lowPivots } = (0, indicators_1.findPivots)(context.candles.map(c => c.close), pivots_window);
        // Calculate volume Z-score
        const recentVolumes = volumes.slice(-20);
        const volumeMean = recentVolumes.reduce((a, b) => a + b) / recentVolumes.length;
        const volumeStd = Math.sqrt(recentVolumes.reduce((a, b) => a + Math.pow(b - volumeMean, 2), 0) / recentVolumes.length);
        const volumeZ = (currentVolume - volumeMean) / volumeStd;
        if (volumeZ < min_volume_z) {
            return this.createResult(false, 0, 'Insufficient volume for trendline break');
        }
        // Fit trendlines to recent pivots
        if (highPivots.length >= 3) {
            const highPoints = highPivots.slice(-3).map(i => highs[i]);
            const { slope, intercept } = (0, indicators_1.linearRegression)(highPoints, 3);
            const projectedTrendlineHigh = slope * (highs.length - 1) + intercept;
            const breakBuffer = projectedTrendlineHigh * (break_buffer / 100);
            if (currentClose > projectedTrendlineHigh + breakBuffer) {
                const breakStrength = (currentClose - projectedTrendlineHigh) / breakBuffer;
                return this.createResult(true, Math.min(breakStrength, 1), `Bullish trendline break with volume Z-score ${volumeZ.toFixed(2)}`);
            }
        }
        if (lowPivots.length >= 3) {
            const lowPoints = lowPivots.slice(-3).map(i => lows[i]);
            const { slope, intercept } = (0, indicators_1.linearRegression)(lowPoints, 3);
            const projectedTrendlineLow = slope * (lows.length - 1) + intercept;
            const breakBuffer = projectedTrendlineLow * (break_buffer / 100);
            if (currentClose < projectedTrendlineLow - breakBuffer) {
                const breakStrength = (projectedTrendlineLow - currentClose) / breakBuffer;
                return this.createResult(true, Math.min(breakStrength, 1), `Bearish trendline break with volume Z-score ${volumeZ.toFixed(2)}`);
            }
        }
        return this.createResult(false, 0, 'No valid trendline breaks detected');
    }
}
exports.default = TrendlineBreakRule;
