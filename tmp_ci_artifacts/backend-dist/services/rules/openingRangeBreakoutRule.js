"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class OpeningRangeBreakoutRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['range_minutes', 'volume_threshold', 'breakout_confirm_ticks']);
        const { range_minutes, volume_threshold, breakout_confirm_ticks } = this.config.params;
        const candles = context.candles;
        if (!candles.length) {
            return this.createResult(false, 0, 'No candle data available');
        }
        // Get market opening time (9:15 AM IST)
        const marketOpen = new Date(candles[0].timestamp);
        marketOpen.setHours(9, 15, 0, 0);
        // Calculate opening range
        const openingRange = this.calculateOpeningRange(candles, marketOpen, range_minutes);
        if (!openingRange) {
            return this.createResult(false, 0, 'Opening range not yet formed');
        }
        const currentCandle = candles[candles.length - 1];
        const currentTime = new Date(currentCandle.timestamp);
        // Only evaluate after opening range is complete
        if (currentTime <= new Date(marketOpen.getTime() + range_minutes * 60000)) {
            return this.createResult(false, 0, 'Still within opening range formation');
        }
        // Calculate average volume for threshold
        const avgVolume = candles
            .slice(-20)
            .reduce((sum, candle) => sum + candle.volume, 0) / 20;
        // Check if opening range had sufficient volume
        if (openingRange.volume < avgVolume * volume_threshold) {
            return this.createResult(false, 0, 'Insufficient opening range volume');
        }
        const tickSize = context.marketState.atr / 10; // Approximate tick size
        const confirmationBuffer = tickSize * breakout_confirm_ticks;
        // Check for breakouts
        if (currentCandle.close > openingRange.high + confirmationBuffer) {
            const strength = this.calculateBreakoutStrength(currentCandle.close, openingRange.high, openingRange.firstCandleClose, true);
            return this.createResult(true, strength, `Bullish OR breakout: ${currentCandle.close.toFixed(2)} above ${openingRange.high.toFixed(2)} with ${(openingRange.volume / avgVolume).toFixed(1)}x volume`);
        }
        if (currentCandle.close < openingRange.low - confirmationBuffer) {
            const strength = this.calculateBreakoutStrength(currentCandle.close, openingRange.low, openingRange.firstCandleClose, false);
            return this.createResult(true, strength, `Bearish OR breakout: ${currentCandle.close.toFixed(2)} below ${openingRange.low.toFixed(2)} with ${(openingRange.volume / avgVolume).toFixed(1)}x volume`);
        }
        // Check if price is near range boundaries
        const nearHighs = Math.abs(currentCandle.close - openingRange.high) < confirmationBuffer * 2;
        const nearLows = Math.abs(currentCandle.close - openingRange.low) < confirmationBuffer * 2;
        if (nearHighs) {
            return this.createResult(false, 0, `Testing OR high: ${openingRange.high.toFixed(2)}`);
        }
        if (nearLows) {
            return this.createResult(false, 0, `Testing OR low: ${openingRange.low.toFixed(2)}`);
        }
        return this.createResult(false, 0, 'No opening range breakout pattern');
    }
    calculateOpeningRange(candles, marketOpen, rangeMinutes) {
        const rangeEndTime = new Date(marketOpen.getTime() + rangeMinutes * 60000);
        let high = -Infinity;
        let low = Infinity;
        let volume = 0;
        let firstCandleClose = null;
        for (const candle of candles) {
            const candleTime = new Date(candle.timestamp);
            if (candleTime < marketOpen)
                continue;
            if (candleTime > rangeEndTime)
                break;
            high = Math.max(high, candle.high);
            low = Math.min(low, candle.low);
            volume += candle.volume;
            if (firstCandleClose === null) {
                firstCandleClose = candle.close;
            }
        }
        if (high === -Infinity || low === Infinity || firstCandleClose === null) {
            return null;
        }
        return { high, low, volume, firstCandleClose };
    }
    calculateBreakoutStrength(currentPrice, breakoutLevel, openPrice, isBullish) {
        // Calculate strength based on:
        // 1. Distance from breakout level (normalized by opening range size)
        // 2. Momentum from opening price
        const breakoutDistance = Math.abs(currentPrice - breakoutLevel);
        const totalMove = Math.abs(currentPrice - openPrice);
        // Normalize to a 0-1 scale, assuming a 2% move is maximum strength
        const normalizedDistance = Math.min(breakoutDistance / breakoutLevel / 0.02, 1);
        const normalizedMove = Math.min(totalMove / openPrice / 0.02, 1);
        // Combine both factors with weights
        return Math.min((normalizedDistance * 0.7 + normalizedMove * 0.3), 1);
    }
}
exports.default = OpeningRangeBreakoutRule;
