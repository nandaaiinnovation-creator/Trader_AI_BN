"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class IVCrushRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['iv_lookback', 'z_threshold']);
        const { iv_lookback, z_threshold } = this.config.params;
        const ivSeries = context.marketState?.optionIVs || [];
        if (!ivSeries || ivSeries.length < iv_lookback)
            return this.createResult(false, 0, 'Insufficient IV history');
        const zs = (0, indicators_1.zScore)(ivSeries, iv_lookback);
        const last = zs[zs.length - 1] || 0;
        const z = Math.abs(last);
        // include the computed z (absolute z-score) in the returned result so tests
        // and consumers can inspect the magnitude of the IV deviation.
        if (last <= -z_threshold) {
            const base = this.createResult(true, 1, 'IV crush detected');
            return { ...base, z };
        }
        if (last >= z_threshold) {
            const base = this.createResult(true, 1, 'IV expansion detected');
            return { ...base, z };
        }
        const base = this.createResult(false, 0, 'No IV gap');
        return { ...base, z };
    }
}
exports.default = IVCrushRule;
