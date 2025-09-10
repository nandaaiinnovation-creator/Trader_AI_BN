"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macd = void 0;
const ema_1 = require("./ema");
function macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    // Defensive: if not enough data return empty arrays
    if (!data || data.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) {
        return { macd: [], signal: [], histogram: [] };
    }
    const fastEMA = (0, ema_1.ema)(data, fastPeriod) || [];
    const slowEMA = (0, ema_1.ema)(data, slowPeriod) || [];
    const macdLine = [];
    // Align EMA arrays (EMAs may be shorter due to period)
    const minLen = Math.min(fastEMA.length, slowEMA.length);
    const fastOffset = fastEMA.length - minLen;
    const slowOffset = slowEMA.length - minLen;
    for (let i = 0; i < minLen; i++) {
        macdLine.push((fastEMA[i + fastOffset] || 0) - (slowEMA[i + slowOffset] || 0));
    }
    const signalLine = (macdLine.length > 0) ? ((0, ema_1.ema)(macdLine, signalPeriod) || []) : [];
    const histogram = [];
    const histOffset = macdLine.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push((macdLine[i + histOffset] || 0) - (signalLine[i] || 0));
    }
    return { macd: macdLine, signal: signalLine, histogram };
}
exports.macd = macd;
