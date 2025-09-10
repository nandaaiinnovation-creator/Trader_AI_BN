"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const indicators_1 = require("../../utils/indicators");
class CVDImbalanceRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['cvd_window', 'z_threshold']);
        const { cvd_window, z_threshold } = this.config.params;
        const ms = context.marketState || {};
        const tickData = (ms.ticks || []);
        if (!tickData || tickData.length < cvd_window)
            return this.createResult(false, 0, 'Insufficient tick data');
        const series = (0, indicators_1.cvd)(tickData.slice(-cvd_window));
        const change = series[series.length - 1] - series[0];
        const absChange = Math.abs(change);
        if (absChange > z_threshold) {
            const dir = change > 0 ? 'buy' : 'sell';
            return this.createResult(true, 1, `CVD imbalance ${dir} detected (${change})`);
        }
        return this.createResult(false, 0, 'No significant CVD imbalance');
    }
}
exports.default = CVDImbalanceRule;
