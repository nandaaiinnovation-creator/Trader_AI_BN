"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bollingerBands = void 0;
const sma_1 = require("./sma");
function bollingerBands(data, period, stdDev) {
    if (data.length < period) {
        return { upper: [], middle: [], lower: [] };
    }
    const middle = (0, sma_1.sma)(data, period);
    const upper = [];
    const lower = [];
    // Calculate standard deviation for each point
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const avg = middle[i - period + 1];
        // Calculate squared differences from mean
        const squaredDiffs = slice.map(x => Math.pow(x - avg, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b) / period;
        const std = Math.sqrt(variance);
        upper.push(avg + (stdDev * std));
        lower.push(avg - (stdDev * std));
    }
    return { upper, middle, lower };
}
exports.bollingerBands = bollingerBands;
