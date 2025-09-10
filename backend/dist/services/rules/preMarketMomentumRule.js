"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class PreMarketMomentumRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['sgx_weight', 'global_weight', 'sectoral_weight', 'volume_weight']);
        const { sgx_weight, global_weight, sectoral_weight, volume_weight } = this.config.params;
        // Get current time
        const currentTime = new Date(context.candles[context.candles.length - 1].timestamp);
        const marketOpen = new Date(currentTime);
        marketOpen.setHours(9, 15, 0, 0);
        // Only evaluate pre-market and first 15 minutes
        if (currentTime > new Date(marketOpen.getTime() + 15 * 60000)) {
            return this.createResult(false, 0, 'Outside pre-market analysis window');
        }
        // Get pre-market statistics from context
        const preMarketStats = this.getPreMarketStats(context);
        if (!preMarketStats) {
            return this.createResult(false, 0, 'Pre-market data not available');
        }
        // Calculate weighted sentiment score
        const sentimentScore = this.calculateSentimentScore(preMarketStats, { sgx_weight, global_weight, sectoral_weight, volume_weight });
        // Calculate trend strength from price action
        const prices = context.candles.map(c => c.close);
        const shortEma = (0, indicators_1.ema)(prices, 5);
        const longEma = (0, indicators_1.ema)(prices, 21);
        if (shortEma.length < 2 || longEma.length < 2) {
            return this.createResult(false, 0, 'Insufficient price data');
        }
        const trendStrength = (shortEma[shortEma.length - 1] - longEma[longEma.length - 1]) /
            longEma[longEma.length - 1];
        // Combine sentiment and trend signals
        const signalStrength = Math.min(Math.abs(sentimentScore * 0.7 + trendStrength * 0.3), 1);
        if (sentimentScore > 0.3 && trendStrength > 0) {
            return this.createResult(true, signalStrength, `Bullish pre-market: SGX ${preMarketStats.sgxNiftyChange.toFixed(1)}%, Volume ${(preMarketStats.volumeRatio).toFixed(1)}x`);
        }
        if (sentimentScore < -0.3 && trendStrength < 0) {
            return this.createResult(true, signalStrength, `Bearish pre-market: SGX ${preMarketStats.sgxNiftyChange.toFixed(1)}%, Volume ${(preMarketStats.volumeRatio).toFixed(1)}x`);
        }
        return this.createResult(false, 0, `Mixed pre-market signals: Sentiment=${sentimentScore.toFixed(2)}, Trend=${trendStrength.toFixed(2)}`);
    }
    getPreMarketStats(context) {
        // In a real implementation, these would come from the context
        // Here we're simulating with data from context.marketState
        const state = context.marketState;
        if (!state.sgxNifty || !state.globalMarkets || !state.sectoralData) {
            return null;
        }
        return {
            sgxNiftyChange: state.sgxNifty.change || 0,
            globalMarketSentiment: state.globalMarkets.sentiment || 0,
            sectoralTrend: state.sectoralData.bankingIndex?.change || 0,
            volumeRatio: state.preMarketVolume?.ratio || 1
        };
    }
    calculateSentimentScore(stats, weights) {
        // Normalize each component to [-1, 1] range
        const sgxScore = Math.max(Math.min(stats.sgxNiftyChange / 2, 1), -1);
        const globalScore = Math.max(Math.min(stats.globalMarketSentiment, 1), -1);
        const sectoralScore = Math.max(Math.min(stats.sectoralTrend / 2, 1), -1);
        const volumeScore = Math.max(Math.min((stats.volumeRatio - 1) / 2, 1), -1);
        // Calculate weighted average
        const totalWeight = weights.sgx_weight + weights.global_weight +
            weights.sectoral_weight + weights.volume_weight;
        return ((sgxScore * weights.sgx_weight +
            globalScore * weights.global_weight +
            sectoralScore * weights.sectoral_weight +
            volumeScore * weights.volume_weight) / totalWeight);
    }
}
exports.default = PreMarketMomentumRule;
