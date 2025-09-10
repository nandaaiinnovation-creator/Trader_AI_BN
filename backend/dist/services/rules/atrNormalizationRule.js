"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class ATRNormalizationRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['atr_period', 'max_atr_mult']);
        const { atr_period, max_atr_mult } = this.config.params;
        const highs = context.candles.map(c => c.high);
        const lows = context.candles.map(c => c.low);
        const closes = context.candles.map(c => c.close);
        const atrSeries = (0, indicators_1.atr)(highs, lows, closes, atr_period);
        if (!atrSeries || atrSeries.length === 0)
            return this.createResult(false, 0, 'Insufficient ATR data');
        const lastAtr = atrSeries[atrSeries.length - 1];
        if (lastAtr > max_atr_mult * (closes[closes.length - 1] || 1)) {
            return this.createResult(false, 0, 'Volatility too high (ATR normalized)');
        }
        return this.createResult(false, 0, 'ATR within bounds');
    }
}
exports.default = ATRNormalizationRule;
