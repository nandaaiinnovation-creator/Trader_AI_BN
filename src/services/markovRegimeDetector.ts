import { TradingRegime } from '../types/rules';

export function detectRegime(prices: number[], lookback: number = 50): TradingRegime {
  if (prices.length < lookback) return TradingRegime.RANGE;
  const recent = prices.slice(-lookback);
  const returns = recent.map((v, i, a) => i === 0 ? 0 : (v - a[i - 1]) / a[i - 1]);
  const vol = Math.sqrt(returns.reduce((s, r) => s + r * r, 0) / returns.length);
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  if (Math.abs(avg) > 0.001 && vol > 0.01) return TradingRegime.TRENDING;
  if (vol < 0.005) return TradingRegime.MEAN_REVERT;
  return TradingRegime.RANGE;
}
