"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsi = void 0;
function rsi(data, period) {
    const result = [];
    if (data.length < period + 1) {
        return result;
    }
    let gains = 0;
    let losses = 0;
    // First RSI calculation
    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) {
            gains += diff;
        }
        else {
            losses -= diff;
        }
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    result.push(100 - (100 / (1 + avgGain / avgLoss)));
    // Rolling RSI calculation
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        }
        else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
        result.push(100 - (100 / (1 + avgGain / avgLoss)));
    }
    return result;
}
exports.rsi = rsi;
