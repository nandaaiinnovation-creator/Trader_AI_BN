"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class MACDCrossRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['fast', 'slow', 'signal', 'min_hist_slope']);
        const { fast, slow, signal, min_hist_slope } = this.config.params;
        const closes = context.candles.map(c => c.close);
        const { macd: macdLine, signal: signalLine, histogram } = (0, indicators_1.macd)(closes, fast, slow, signal);
        if (macdLine.length === 0 || signalLine.length === 0 || histogram.length === 0) {
            return this.createResult(false, 0, 'Insufficient data for MACD');
        }
        const lastMacd = macdLine[macdLine.length - 1];
        const lastSignal = signalLine[signalLine.length - 1];
        const prevHist = histogram[histogram.length - 2] || 0;
        const lastHist = histogram[histogram.length - 1];
        const histSlope = lastHist - prevHist;
        // Cross detection
        if (lastMacd > lastSignal && histSlope > min_hist_slope) {
            const strength = Math.min((lastMacd - lastSignal) / Math.abs(lastSignal || 1), 1);
            return this.createResult(true, strength, `MACD bullish cross with histogram slope ${histSlope.toFixed(4)}`);
        }
        if (lastMacd < lastSignal && histSlope < -min_hist_slope) {
            const strength = Math.min((lastSignal - lastMacd) / Math.abs(lastSignal || 1), 1);
            return this.createResult(true, strength, `MACD bearish cross with histogram slope ${histSlope.toFixed(4)}`);
        }
        return this.createResult(false, 0, 'No MACD cross confirmed');
    }
}
exports.default = MACDCrossRule;
