"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sma = void 0;
function sma(data, period) {
    const result = [];
    if (data.length < period) {
        return result;
    }
    let sum = 0;
    // Initial sum
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    result.push(sum / period);
    // Rolling window
    for (let i = period; i < data.length; i++) {
        sum = sum - data[i - period] + data[i];
        result.push(sum / period);
    }
    return result;
}
exports.sma = sma;
