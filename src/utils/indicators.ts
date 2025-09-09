import { SMA, EMA, RSI, ATR, VWAP, MACD, BollingerBands, StochasticRSI } from 'technicalindicators';

// SMA with configurable period
export function sma(data: number[], period: number): number[] {
  return SMA.calculate({ period, values: data });
}

// EMA with configurable period
export function ema(data: number[], period: number): number[] {
  return EMA.calculate({ period, values: data });
}

// RSI with configurable period
export function rsi(data: number[], period: number = 14): number[] {
  return RSI.calculate({ period, values: data });
}

// ATR with configurable period
export function atr(high: number[], low: number[], close: number[], period: number = 14): number[] {
  return ATR.calculate({ high, low, close, period });
}

// VWAP calculation
export function vwap(high: number[], low: number[], close: number[], volume: number[]): number[] {
  return VWAP.calculate({ high, low, close, volume });
}

// MACD with configurable periods
export function macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  return MACD.calculate({
    values: data,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
}

// Bollinger Bands
export function bb(data: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[]; bandwidth: number[] } {
  const result = BollingerBands.calculate({
    period,
    values: data,
    stdDev
  });

  // Calculate bandwidth
  const bandwidth = result.map((band: { upper: number; lower: number; middle: number }) => (band.upper - band.lower) / band.middle);

  return {
  upper: result.map((b: { upper: number; middle: number; lower: number }) => b.upper),
  middle: result.map((b: { upper: number; middle: number; lower: number }) => b.middle),
  lower: result.map((b: { upper: number; middle: number; lower: number }) => b.lower),
    bandwidth
  };
}

// Stochastic RSI
export function stochRsi(data: number[], rsiPeriod: number = 14, stochPeriod: number = 14, kPeriod: number = 3, dPeriod: number = 3) {
  return StochasticRSI.calculate({
    values: data,
    rsiPeriod,
    stochasticPeriod: stochPeriod,
    kPeriod,
    dPeriod
  });
}

// On-Balance Volume (OBV)
export function obv(close: number[], volume: number[]): number[] {
  const result: number[] = [0];
  
  for (let i = 1; i < close.length; i++) {
    if (close[i] > close[i - 1]) {
      result[i] = result[i - 1] + volume[i];
    } else if (close[i] < close[i - 1]) {
      result[i] = result[i - 1] - volume[i];
    } else {
      result[i] = result[i - 1];
    }
  }
  
  return result;
}

// Cumulative Volume Delta (CVD)
export function cvd(tickData: Array<{ price: number; volume: number; side: 'buy' | 'sell' }>): number[] {
  const result: number[] = [0];
  
  for (let i = 0; i < tickData.length; i++) {
    const tick = tickData[i];
    const delta = tick.side === 'buy' ? tick.volume : -tick.volume;
    result[i + 1] = result[i] + delta;
  }
  
  return result;
}

// Average Directional Index (ADX)
export function adx(high: number[], low: number[], close: number[], period: number = 14): number[] {
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

// Helper: True Range
function trueRange(high: number[], low: number[], close: number[]): number[] {
  const tr: number[] = [];
  
  for (let i = 1; i < high.length; i++) {
    tr.push(Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    ));
  }
  
  return tr;
}

// Helper: +DM
function plusDirectionalMovement(high: number[]): number[] {
  const pdm: number[] = [];
  
  for (let i = 1; i < high.length; i++) {
    const up = high[i] - high[i - 1];
    pdm.push(up > 0 ? up : 0);
  }
  
  return pdm;
}

// Helper: -DM
function minusDirectionalMovement(low: number[]): number[] {
  const mdm: number[] = [];
  
  for (let i = 1; i < low.length; i++) {
    const down = low[i - 1] - low[i];
    mdm.push(down > 0 ? down : 0);
  }
  
  return mdm;
}

// Helper: Wilder's Smoothing
function wilderSmoothing(data: number[], period: number): number[] {
  const smoothed: number[] = [];
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
export function zScore(data: number[], lookback: number = 20): number[] {
  const result: number[] = [];
  
  for (let i = lookback - 1; i < data.length; i++) {
    const slice = data.slice(i - lookback + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b) / lookback;
    const stdDev = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lookback);
    result.push((data[i] - mean) / stdDev);
  }
  
  return result;
}

// Detect pivot points
export function findPivots(data: number[], lookback: number = 5): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  
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

// Linear regression
export function linearRegression(y: number[], lookback: number): { slope: number; intercept: number } {
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
