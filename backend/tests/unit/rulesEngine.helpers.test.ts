import { RulesEngine } from '../../src/services/rulesEngine';

describe('RulesEngine static helpers', () => {
  test('getCandleDirection returns up for increasing highs/lows', () => {
    const now = Date.now();
    const candles = [
      { open: 1, high: 2, low: 1, close: 1.5, timestamp: new Date(now - 30000), volume: 0 },
      { open: 1.5, high: 2.5, low: 1.2, close: 2, timestamp: new Date(now - 20000), volume: 0 },
      { open: 2, high: 3, low: 1.8, close: 2.8, timestamp: new Date(now - 10000), volume: 0 },
    ];
    expect(RulesEngine.getCandleDirection(candles, 3)).toBe('up');
  });

  test('getCandleDirection returns down for decreasing highs/lows', () => {
    const now2 = Date.now();
    const candles = [
      { open: 3, high: 3.5, low: 2.5, close: 3.1, timestamp: new Date(now2 - 30000), volume: 0 },
      { open: 3.1, high: 3.2, low: 2.4, close: 2.9, timestamp: new Date(now2 - 20000), volume: 0 },
      { open: 2.9, high: 2.95, low: 2.2, close: 2.5, timestamp: new Date(now2 - 10000), volume: 0 },
    ];
    expect(RulesEngine.getCandleDirection(candles, 3)).toBe('down');
  });

  test('getBodySize, wicks and patterns', () => {
  const ts = Date.now();
  // Pair for body/wick calculations
  const c1 = { open: 1, high: 2, low: 0.9, close: 1.8, timestamp: new Date(ts - 10000), volume: 0 };
  // For isInsideBar: previous has wider range than current
  const prevInside = { open: 2, high: 3, low: 0.5, close: 2.5, timestamp: new Date(ts - 20000), volume: 0 };
  const currentInside = { open: 2.2, high: 2.8, low: 1.2, close: 2.6, timestamp: new Date(ts - 15000), volume: 0 };
  // For engulfing: current has larger body and its close >= previous.high (bullish engulfing)
  const prevSmall = { open: 1.0, high: 1.5, low: 0.9, close: 1.1, timestamp: new Date(ts - 5000), volume: 0 };
  const currentBig = { open: 0.95, high: 1.6, low: 0.9, close: 1.6, timestamp: new Date(ts - 1000), volume: 0 };

  expect(RulesEngine.getBodySize(c1)).toBeCloseTo(0.8);
  expect(RulesEngine.getUpperWick(c1)).toBeCloseTo(0.2);
  expect(RulesEngine.getLowerWick(c1)).toBeCloseTo(0.1);
  expect(RulesEngine.isInsideBar(currentInside, prevInside)).toBe(true);
  expect(RulesEngine.isEngulfing(currentBig, prevSmall)).toBe(true);
  });
});
