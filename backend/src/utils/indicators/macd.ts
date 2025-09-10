import { ema } from './ema';

export interface MACD {
    macd: number[];
    signal: number[];
    histogram: number[];
}

export function macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACD {
    // Defensive: if not enough data return empty arrays
    if (!data || data.length < Math.max(fastPeriod, slowPeriod, signalPeriod)) {
        return { macd: [], signal: [], histogram: [] };
    }

    const fastEMA = ema(data, fastPeriod) || [];
    const slowEMA = ema(data, slowPeriod) || [];
    const macdLine: number[] = [];

    // Align EMA arrays (EMAs may be shorter due to period)
    const minLen = Math.min(fastEMA.length, slowEMA.length);
    const fastOffset = fastEMA.length - minLen;
    const slowOffset = slowEMA.length - minLen;

    for (let i = 0; i < minLen; i++) {
        macdLine.push((fastEMA[i + fastOffset] || 0) - (slowEMA[i + slowOffset] || 0));
    }

    const signalLine = (macdLine.length > 0) ? (ema(macdLine, signalPeriod) || []) : [];

    const histogram: number[] = [];
    const histOffset = macdLine.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push((macdLine[i + histOffset] || 0) - (signalLine[i] || 0));
    }

    return { macd: macdLine, signal: signalLine, histogram };
}
