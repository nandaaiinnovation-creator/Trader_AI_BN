"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class SectorRotationRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['momentum_window', 'divergence_threshold']);
        const { momentum_window, divergence_threshold } = this.config.params;
        const sectoralData = context.marketState.sectoralData;
        if (!sectoralData?.psuBanks?.history || !sectoralData?.privateBanks?.history) {
            return this.createResult(false, 0, 'Sector history not available');
        }
        const psuHistory = sectoralData.psuBanks.history;
        const privateHistory = sectoralData.privateBanks.history;
        if (psuHistory.length < momentum_window || privateHistory.length < momentum_window) {
            return this.createResult(false, 0, 'Insufficient sector history');
        }
        // Calculate momentum for each sector
        const psuMomentum = this.calculateMomentum(psuHistory, momentum_window);
        const privateMomentum = this.calculateMomentum(privateHistory, momentum_window);
        const divergence = privateMomentum - psuMomentum;
        // Check for divergence
        if (Math.abs(divergence) > divergence_threshold) {
            const strength = Math.min(Math.abs(divergence) / (divergence_threshold * 2), 1);
            if (divergence > 0) {
                return this.createResult(true, strength, `Bullish rotation: Private banks (${privateMomentum.toFixed(2)}) outperforming PSU banks (${psuMomentum.toFixed(2)})`);
            }
            else {
                return this.createResult(true, strength, `Bearish rotation: PSU banks (${psuMomentum.toFixed(2)}) outperforming Private banks (${privateMomentum.toFixed(2)})`);
            }
        }
        // Check for confirmation
        if (psuMomentum > 0 && privateMomentum > 0) {
            const strength = Math.min((psuMomentum + privateMomentum) / (divergence_threshold * 4), 1);
            return this.createResult(true, strength, `Bullish confirmation: Both sectors showing positive momentum.`);
        }
        if (psuMomentum < 0 && privateMomentum < 0) {
            const strength = Math.min(Math.abs(psuMomentum + privateMomentum) / (divergence_threshold * 4), 1);
            return this.createResult(true, strength, `Bearish confirmation: Both sectors showing negative momentum.`);
        }
        return this.createResult(false, 0, `No clear rotation or confirmation. Divergence: ${divergence.toFixed(2)}`);
    }
    calculateMomentum(prices, period) {
        const movingAverage = (0, indicators_1.sma)(prices, period);
        const currentPrice = prices[prices.length - 1];
        const ma = movingAverage[movingAverage.length - 1];
        return (currentPrice - ma) / ma;
    }
}
exports.default = SectorRotationRule;
