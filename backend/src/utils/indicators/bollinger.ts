import { sma } from './sma';

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function bollingerBands(data: number[], period: number, stdDev: number): BollingerBands {
  if (data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const middle = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

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
