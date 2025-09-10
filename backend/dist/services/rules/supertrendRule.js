"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class SupertrendRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['atr_period', 'multiplier', 'fresh_flip_bars']);
        const { atr_period, multiplier, fresh_flip_bars } = this.config.params;
        const highs = context.candles.map(c => c.high);
        const lows = context.candles.map(c => c.low);
        const closes = context.candles.map(c => c.close);
        const atrSeries = (0, indicators_1.atr)(highs, lows, closes, atr_period);
        if (atrSeries.length === 0)
            return this.createResult(false, 0, 'Insufficient data for ATR');
        const lastAtr = atrSeries[atrSeries.length - 1];
        const lastClose = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2] || lastClose;
        // Simple Supertrend proxy: direction flips when price crosses ATR-based band
        const band = lastAtr * multiplier;
        if (lastClose > prevClose && lastClose > (closes[closes.length - 2] + band)) {
            return this.createResult(true, 1, 'Supertrend bullish fresh flip');
        }
        if (lastClose < prevClose && lastClose < (closes[closes.length - 2] - band)) {
            return this.createResult(true, 1, 'Supertrend bearish fresh flip');
        }
        return this.createResult(false, 0, 'No Supertrend flip');
    }
}
exports.default = SupertrendRule;
