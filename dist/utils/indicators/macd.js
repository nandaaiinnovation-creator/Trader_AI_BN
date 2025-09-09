"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.macd = void 0;
const ema_1 = require("./ema");
function macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = (0, ema_1.ema)(data, fastPeriod);
    const slowEMA = (0, ema_1.ema)(data, slowPeriod);
    const macdLine = [];
    // Calculate MACD line
    const startIdx = Math.max(fastEMA.length, slowEMA.length) - Math.min(fastEMA.length, slowEMA.length);
    for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
        macdLine.push(fastEMA[i + startIdx] - slowEMA[i]);
    }
    // Calculate signal line
    const signalLine = (0, ema_1.ema)(macdLine, signalPeriod);
    // Calculate histogram
    const histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
    }
    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
}
exports.macd = macd;
