"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const bollinger_1 = require("../../utils/indicators/bollinger");
class BollingerSqueezeRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['bb_len', 'bb_sigma', 'min_bandwidth', 'follow_through_bars']);
        const { bb_len, bb_sigma, min_bandwidth, follow_through_bars } = this.config.params;
        const closes = context.candles.map(c => c.close);
        const bb = (0, bollinger_1.bollingerBands)(closes, bb_len, bb_sigma);
        if (bb.middle.length === 0 || bb.upper.length === 0 || bb.lower.length === 0) {
            return this.createResult(false, 0, 'Insufficient BB data');
        }
        // Bandwidth = (upper - lower) / middle
        const lastUpper = bb.upper[bb.upper.length - 1];
        const lastLower = bb.lower[bb.lower.length - 1];
        const lastMiddle = bb.middle[bb.middle.length - 1];
        const bandwidth = (lastUpper - lastLower) / (lastMiddle || 1);
        // Check for squeeze
        if (bandwidth < min_bandwidth) {
            // Check for expansion in next bars (follow-through)
            const recentCloses = closes.slice(-follow_through_bars - 1);
            const breakoutBull = recentCloses.some(c => c > lastUpper);
            const breakoutBear = recentCloses.some(c => c < lastLower);
            if (breakoutBull) {
                return this.createResult(true, 1, `Bollinger squeeze -> bullish expansion (bandwidth ${(bandwidth * 100).toFixed(2)}%)`);
            }
            if (breakoutBear) {
                return this.createResult(true, 1, `Bollinger squeeze -> bearish expansion (bandwidth ${(bandwidth * 100).toFixed(2)}%)`);
            }
            return this.createResult(false, 0, `Squeeze detected but no expansion yet (bandwidth ${(bandwidth * 100).toFixed(2)}%)`);
        }
        return this.createResult(false, 0, 'No BB squeeze detected');
    }
}
exports.default = BollingerSqueezeRule;
