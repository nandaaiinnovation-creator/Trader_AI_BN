import { ema } from './ema';

export interface MACD {
    macd: number[];
    signal: number[];
    histogram: number[];
}

export function macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACD {
    const fastEMA = ema(data, fastPeriod);
    const slowEMA = ema(data, slowPeriod);
    const macdLine: number[] = [];
    
    // Calculate MACD line
    const startIdx = Math.max(fastEMA.length, slowEMA.length) - Math.min(fastEMA.length, slowEMA.length);
    for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
        macdLine.push(fastEMA[i + startIdx] - slowEMA[i]);
    }

    // Calculate signal line
    const signalLine = ema(macdLine, signalPeriod);

    // Calculate histogram
    const histogram: number[] = [];
    for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
    }

    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
}
