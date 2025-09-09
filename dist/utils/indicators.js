"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearRegression = exports.findPivots = exports.zScore = exports.adx = exports.cvd = exports.obv = exports.stochRsi = exports.bb = exports.macd = exports.vwap = exports.atr = exports.rsi = exports.ema = exports.sma = void 0;
const technicalindicators_1 = require("technicalindicators");
// SMA with configurable period
function sma(data, period) {
    return technicalindicators_1.SMA.calculate({ period, values: data });
}
exports.sma = sma;
// EMA with configurable period
function ema(data, period) {
    return technicalindicators_1.EMA.calculate({ period, values: data });
}
exports.ema = ema;
// RSI with configurable period
function rsi(data, period = 14) {
    return technicalindicators_1.RSI.calculate({ period, values: data });
}
exports.rsi = rsi;
// ATR with configurable period
function atr(high, low, close, period = 14) {
    return technicalindicators_1.ATR.calculate({ high, low, close, period });
}
exports.atr = atr;
// VWAP calculation
function vwap(high, low, close, volume) {
    return technicalindicators_1.VWAP.calculate({ high, low, close, volume });
}
exports.vwap = vwap;
// MACD with configurable periods
function macd(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    return technicalindicators_1.MACD.calculate({
        values: data,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    });
}
exports.macd = macd;
// Bollinger Bands
function bb(data, period = 20, stdDev = 2) {
    const result = technicalindicators_1.BollingerBands.calculate({
        period,
        values: data,
        stdDev
    });
    // Calculate bandwidth
    const bandwidth = result.map((band) => (band.upper - band.lower) / band.middle);
    return {
        upper: result.map((b) => b.upper),
        middle: result.map((b) => b.middle),
        lower: result.map((b) => b.lower),
        bandwidth
    };
}
exports.bb = bb;
// Stochastic RSI
function stochRsi(data, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
    return technicalindicators_1.StochasticRSI.calculate({
        values: data,
        rsiPeriod,
        stochasticPeriod: stochPeriod,
        kPeriod,
        dPeriod
    });
}
exports.stochRsi = stochRsi;
// On-Balance Volume (OBV)
function obv(close, volume) {
    const result = [0];
    for (let i = 1; i < close.length; i++) {
        if (close[i] > close[i - 1]) {
            result[i] = result[i - 1] + volume[i];
        }
        else if (close[i] < close[i - 1]) {
            result[i] = result[i - 1] - volume[i];
        }
        else {
            result[i] = result[i - 1];
        }
    }
    return result;
}
exports.obv = obv;
// Cumulative Volume Delta (CVD)
function cvd(tickData) {
    const result = [0];
    for (let i = 0; i < tickData.length; i++) {
        const tick = tickData[i];
        const delta = tick.side === 'buy' ? tick.volume : -tick.volume;
        result[i + 1] = result[i] + delta;
    }
    return result;
}
exports.cvd = cvd;
// Average Directional Index (ADX)
function adx(high, low, close, period = 14) {
    const result = [];
    const tr = trueRange(high, low, close);
    const plusDM = plusDirectionalMovement(high);
    const minusDM = minusDirectionalMovement(low);
    const smoothedTR = wilderSmoothing(tr, period);
    const smoothedPlusDM = wilderSmoothing(plusDM, period);
    const smoothedMinusDM = wilderSmoothing(minusDM, period);
    const plusDI = smoothedPlusDM.map((pdm, i) => (pdm / smoothedTR[i]) * 100);
    const minusDI = smoothedMinusDM.map((mdm, i) => (mdm / smoothedTR[i]) * 100);
    for (let i = period - 1; i < high.length; i++) {
        const dx = Math.abs(plusDI[i] - minusDI[i]) / (plusDI[i] + minusDI[i]) * 100;
        result.push(dx);
    }
    return wilderSmoothing(result, period);
}
exports.adx = adx;
// Helper: True Range
function trueRange(high, low, close) {
    const tr = [];
    for (let i = 1; i < high.length; i++) {
        tr.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])));
    }
    return tr;
}
// Helper: +DM
function plusDirectionalMovement(high) {
    const pdm = [];
    for (let i = 1; i < high.length; i++) {
        const up = high[i] - high[i - 1];
        pdm.push(up > 0 ? up : 0);
    }
    return pdm;
}
// Helper: -DM
function minusDirectionalMovement(low) {
    const mdm = [];
    for (let i = 1; i < low.length; i++) {
        const down = low[i - 1] - low[i];
        mdm.push(down > 0 ? down : 0);
    }
    return mdm;
}
// Helper: Wilder's Smoothing
function wilderSmoothing(data, period) {
    const smoothed = [];
    let sum = 0;
    // Initial SMA
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    smoothed.push(sum / period);
    // Wilder's smoothing
    for (let i = period; i < data.length; i++) {
        smoothed.push((smoothed[smoothed.length - 1] * (period - 1) + data[i]) / period);
    }
    return smoothed;
}
// Z-Score calculation
function zScore(data, lookback = 20) {
    const result = [];
    for (let i = lookback - 1; i < data.length; i++) {
        const slice = data.slice(i - lookback + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b) / lookback;
        const stdDev = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lookback);
        result.push((data[i] - mean) / stdDev);
    }
    return result;
}
exports.zScore = zScore;
// Detect pivot points
function findPivots(data, lookback = 5) {
    const highs = [];
    const lows = [];
    for (let i = lookback; i < data.length - lookback; i++) {
        const windowHigh = Math.max(...data.slice(i - lookback, i + lookback + 1));
        const windowLow = Math.min(...data.slice(i - lookback, i + lookback + 1));
        if (data[i] === windowHigh) {
            highs.push(i);
        }
        if (data[i] === windowLow) {
            lows.push(i);
        }
    }
    return { highs, lows };
}
exports.findPivots = findPivots;
// Linear regression
function linearRegression(y, lookback) {
    const x = Array.from({ length: lookback }, (_, i) => i);
    const n = lookback;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}
exports.linearRegression = linearRegression;
