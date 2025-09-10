"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class IntradayCorrelationRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['correlation_window', 'divergence_threshold', 'confirmation_bars']);
        const { correlation_window, divergence_threshold, confirmation_bars } = this.config.params;
        const bnCandles = context.candles;
        const niftyCandles = context.marketState.nifty?.candles;
        if (!niftyCandles || niftyCandles.length < correlation_window || bnCandles.length < correlation_window) {
            return this.createResult(false, 0, 'Insufficient data for correlation analysis');
        }
        // Align candles by timestamp
        const { bnReturns, niftyReturns } = this.getAlignedReturns(bnCandles, niftyCandles, correlation_window);
        if (bnReturns.length < correlation_window) {
            return this.createResult(false, 0, 'Could not align Nifty & BankNifty data');
        }
        // Calculate correlation
        const correlation = this.calculateCorrelation(bnReturns, niftyReturns);
        // Check for divergence
        const bnMomentum = bnReturns.slice(-confirmation_bars).reduce((a, b) => a + b, 0);
        const niftyMomentum = niftyReturns.slice(-confirmation_bars).reduce((a, b) => a + b, 0);
        const divergence = bnMomentum - niftyMomentum;
        if (Math.abs(divergence) > divergence_threshold && correlation < 0.7) {
            const strength = Math.min(Math.abs(divergence) / (divergence_threshold * 2), 1);
            const direction = divergence > 0 ? 'Bullish' : 'Bearish';
            return this.createResult(true, strength, `${direction} divergence: BN momentum ${bnMomentum.toFixed(4)} vs Nifty ${niftyMomentum.toFixed(4)} with correlation ${correlation.toFixed(2)}`);
        }
        return this.createResult(false, 0, `Correlation: ${correlation.toFixed(2)}, Divergence: ${divergence.toFixed(4)}`);
    }
    getAlignedReturns(bnCandles, niftyCandles, window) {
        const bnMap = new Map(bnCandles.map(c => [new Date(c.timestamp).getTime(), c.close]));
        const niftyMap = new Map(niftyCandles.map(c => [new Date(c.timestamp).getTime(), c.close]));
        const commonTimestamps = [...bnMap.keys()].filter(ts => niftyMap.has(ts)).sort((a, b) => a - b).slice(-window - 1);
        const bnReturns = [];
        const niftyReturns = [];
        for (let i = 1; i < commonTimestamps.length; i++) {
            const ts = commonTimestamps[i];
            const prevTs = commonTimestamps[i - 1];
            bnReturns.push((bnMap.get(ts) - bnMap.get(prevTs)) / bnMap.get(prevTs));
            niftyReturns.push((niftyMap.get(ts) - niftyMap.get(prevTs)) / niftyMap.get(prevTs));
        }
        return { bnReturns, niftyReturns };
    }
    calculateCorrelation(x, y) {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        if (denominator === 0)
            return 1;
        return numerator / denominator;
    }
}
exports.default = IntradayCorrelationRule;
