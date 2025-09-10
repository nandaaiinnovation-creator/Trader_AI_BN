"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atr = void 0;
function atr(highs, lows, closes, period = 14) {
    const result = [];
    if (highs.length < 2 || lows.length < 2 || closes.length < 2) {
        return result;
    }
    // Calculate True Ranges
    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    // Calculate first ATR
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += trueRanges[i];
    }
    let atr = sum / period;
    result.push(atr);
    // Calculate subsequent ATRs
    for (let i = period; i < trueRanges.length; i++) {
        atr = ((atr * (period - 1)) + trueRanges[i]) / period;
        result.push(atr);
    }
    return result;
}
exports.atr = atr;
