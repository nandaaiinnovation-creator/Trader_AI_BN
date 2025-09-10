"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class MomentumThresholdRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['momentum_period', 'threshold_mult', 'consec_bars']);
        const { momentum_period, threshold_mult, consec_bars } = this.config.params;
        const closes = context.candles.map(c => c.close);
        // Calculate momentum using MACD with custom settings
        const macdRes = (0, indicators_1.macd)(closes, momentum_period, momentum_period * 2, Math.floor(momentum_period / 2)) || { histogram: [] };
        const histogram = macdRes.histogram || [];
        if (histogram.length < consec_bars) {
            return this.createResult(false, 0, 'Insufficient data for momentum analysis');
        }
        // Calculate dynamic threshold based on historical momentum
        const recentHist = histogram.slice(-20);
        const avgMomentum = recentHist.reduce((sum, val) => sum + Math.abs(val), 0) / recentHist.length;
        const threshold = avgMomentum * threshold_mult;
        // Check consecutive bars above threshold
        const checkBars = histogram.slice(-consec_bars);
        let consecutiveBullish = true;
        let consecutiveBearish = true;
        for (const bar of checkBars) {
            if (bar <= threshold)
                consecutiveBullish = false;
            if (bar >= -threshold)
                consecutiveBearish = false;
        }
        // Calculate strength based on average momentum vs threshold
        const currentMomentum = Math.abs(checkBars[checkBars.length - 1]);
        const normalizedStrength = Math.min(currentMomentum / (threshold * 2), 1);
        if (consecutiveBullish) {
            return this.createResult(true, normalizedStrength, `Strong bullish momentum: ${consec_bars} bars above ${threshold.toFixed(4)} threshold`);
        }
        if (consecutiveBearish) {
            return this.createResult(true, normalizedStrength, `Strong bearish momentum: ${consec_bars} bars below ${(-threshold).toFixed(4)} threshold`);
        }
        return this.createResult(false, 0, 'No sustained momentum above threshold');
    }
}
exports.default = MomentumThresholdRule;
