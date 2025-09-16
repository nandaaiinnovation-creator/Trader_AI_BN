export interface LinearRegressionResult {
    slope: number;
    intercept: number;
    r2: number;
}

export function linearRegression(prices: number[], period: number): LinearRegressionResult {
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

    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
    }

    const denom = (n * sumXX - sumX * sumX) || 1; // guard against zero
    const slope = (n * sumXY - sumX * sumY) / denom;
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

    const r2 = totalSS === 0 ? 0 : 1 - (residualSS / totalSS);

    return { slope, intercept, r2 };
}
