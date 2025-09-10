"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class VolumeClimaxRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['volume_ma_period', 'climax_mult', 'price_reversal_pct']);
        const { volume_ma_period, climax_mult, price_reversal_pct } = this.config.params;
        const volumes = context.candles.map(c => c.volume);
        const closes = context.candles.map(c => c.close);
        // Calculate volume moving average
        const volumeSMA = (0, indicators_1.sma)(volumes, volume_ma_period);
        if (volumeSMA.length < 2) {
            return this.createResult(false, 0, 'Insufficient data for volume analysis');
        }
        const currentVolume = volumes[volumes.length - 1];
        const volumeMA = volumeSMA[volumeSMA.length - 1];
        const volumeRatio = currentVolume / volumeMA;
        // Check for volume climax
        if (volumeRatio < climax_mult) {
            return this.createResult(false, 0, 'No volume climax detected');
        }
        // Calculate price change
        const currentPrice = closes[closes.length - 1];
        const prevPrice = closes[closes.length - 2];
        const priceChange = (currentPrice - prevPrice) / prevPrice * 100;
        // Calculate climax strength
        const normalizedStrength = Math.min((volumeRatio - climax_mult) / 2, 1);
        // Check for bullish climax (high volume + price reversal down)
        if (priceChange < -price_reversal_pct) {
            return this.createResult(true, normalizedStrength, `Bullish volume climax: ${volumeRatio.toFixed(2)}x average volume with ${Math.abs(priceChange).toFixed(2)}% price drop`);
        }
        // Check for bearish climax (high volume + price reversal up)
        if (priceChange > price_reversal_pct) {
            return this.createResult(true, normalizedStrength, `Bearish volume climax: ${volumeRatio.toFixed(2)}x average volume with ${priceChange.toFixed(2)}% price surge`);
        }
        return this.createResult(false, 0, 'No price reversal with volume climax');
    }
}
exports.default = VolumeClimaxRule;
