"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class AdrPdrBreakoutRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['adr_period', 'breakout_confirmation_atr']);
        const { adr_period, breakout_confirmation_atr } = this.config.params;
        const dailyHistory = context.marketState.dailyHistory;
        if (!dailyHistory || dailyHistory.length < adr_period) {
            return this.createResult(false, 0, 'Insufficient daily history for ADR/PDR');
        }
        // Calculate ADR
        const adr = dailyHistory.slice(-adr_period).reduce((sum, day) => sum + (day.high - day.low), 0) / adr_period;
        // Get PDR
        const pdr = dailyHistory[dailyHistory.length - 1];
        const pdrHigh = pdr.high;
        const pdrLow = pdr.low;
        const currentCandle = context.candles[context.candles.length - 1];
        const currentPrice = currentCandle.close;
        const currentAtr = context.marketState.atr;
        const confirmation = currentAtr * breakout_confirmation_atr;
        // Check for breakouts
        if (currentPrice > pdrHigh + confirmation) {
            const strength = Math.min((currentPrice - pdrHigh) / adr, 1);
            return this.createResult(true, strength, `Bullish PDR breakout: Price above ${pdrHigh.toFixed(2)}`);
        }
        if (currentPrice < pdrLow - confirmation) {
            const strength = Math.min((pdrLow - currentPrice) / adr, 1);
            return this.createResult(true, strength, `Bearish PDR breakout: Price below ${pdrLow.toFixed(2)}`);
        }
        // Check for ADR extensions
        const adrHigh = pdr.low + adr;
        const adrLow = pdr.high - adr;
        if (currentPrice > adrHigh) {
            const strength = Math.min((currentPrice - adrHigh) / adr, 1);
            return this.createResult(true, strength, `Bullish ADR extension: Price above ADR high ${adrHigh.toFixed(2)}`);
        }
        if (currentPrice < adrLow) {
            const strength = Math.min((adrLow - currentPrice) / adr, 1);
            return this.createResult(true, strength, `Bearish ADR extension: Price below ADR low ${adrLow.toFixed(2)}`);
        }
        return this.createResult(false, 0, `Price within PDR/ADR. PDR: ${pdrLow.toFixed(2)}-${pdrHigh.toFixed(2)}`);
    }
}
exports.default = AdrPdrBreakoutRule;
