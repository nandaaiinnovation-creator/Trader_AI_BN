"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRegime = void 0;
const rules_1 = require("../types/rules");
function detectRegime(prices, lookback = 50) {
    if (prices.length < lookback)
        return rules_1.TradingRegime.RANGE;
    const recent = prices.slice(-lookback);
    const returns = recent.map((v, i, a) => i === 0 ? 0 : (v - a[i - 1]) / a[i - 1]);
    const vol = Math.sqrt(returns.reduce((s, r) => s + r * r, 0) / returns.length);
    const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
    if (Math.abs(avg) > 0.001 && vol > 0.01)
        return rules_1.TradingRegime.TRENDING;
    if (vol < 0.005)
        return rules_1.TradingRegime.MEAN_REVERT;
    return rules_1.TradingRegime.RANGE;
}
exports.detectRegime = detectRegime;
