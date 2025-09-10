"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearRegression = void 0;
function linearRegression(prices, period) {
    if (prices.length < period) {
        return { slope: 0, intercept: 0, r2: 0 };
    }
    const x = Array.from({ length: period }, (_, i) => i);
    const y = prices.slice(-period);
    const n = period;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
        sumYY += y[i] * y[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Calculate R-squared
    const yMean = sumY / n;
    let totalSS = 0;
    let residualSS = 0;
    for (let i = 0; i < n; i++) {
        const yPred = slope * x[i] + intercept;
        totalSS += Math.pow(y[i] - yMean, 2);
        residualSS += Math.pow(y[i] - yPred, 2);
    }
    const r2 = 1 - (residualSS / totalSS);
    return { slope, intercept, r2 };
}
exports.linearRegression = linearRegression;
