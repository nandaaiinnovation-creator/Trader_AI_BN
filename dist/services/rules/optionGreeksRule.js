"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class OptionGreeksRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['delta_threshold', 'gamma_threshold', 'vega_threshold']);
        const { delta_threshold, gamma_threshold, vega_threshold } = this.config.params;
        const optionChain = context.marketState.optionChain;
        if (!optionChain || optionChain.length === 0) {
            return this.createResult(false, 0, 'Option chain data not available');
        }
        const greeks = this.aggregateGreeks(optionChain);
        // Analyze Net Delta for directional bias
        if (Math.abs(greeks.netDelta) > delta_threshold) {
            const strength = Math.min(Math.abs(greeks.netDelta) / (delta_threshold * 2), 1);
            const direction = greeks.netDelta > 0 ? 'Bullish' : 'Bearish';
            return this.createResult(true, strength, `${direction} delta bias: Net Delta is ${greeks.netDelta.toFixed(0)}`);
        }
        // Analyze Gamma for potential volatility (gamma squeeze)
        if (greeks.gammaExposure > gamma_threshold) {
            const strength = Math.min(greeks.gammaExposure / (gamma_threshold * 2), 1);
            return this.createResult(true, strength, `High Gamma Exposure: ${greeks.gammaExposure.toFixed(0)}. Potential for sharp moves.`);
        }
        // Analyze Vega for sensitivity to IV changes
        if (Math.abs(greeks.netVega) > vega_threshold) {
            const strength = Math.min(Math.abs(greeks.netVega) / (vega_threshold * 2), 1);
            const direction = greeks.netVega > 0 ? 'long' : 'short';
            return this.createResult(true, strength, `Market is net ${direction} volatility: Net Vega is ${greeks.netVega.toFixed(0)}`);
        }
        return this.createResult(false, 0, `Greeks neutral: Delta=${greeks.netDelta.toFixed(0)}, GammaExp=${greeks.gammaExposure.toFixed(0)}`);
    }
    aggregateGreeks(optionChain) {
        let netDelta = 0;
        let netGamma = 0;
        let netVega = 0;
        let netTheta = 0;
        let gammaExposure = 0;
        optionChain.forEach(strike => {
            if (strike.callGreeks && strike.putGreeks) {
                // OI-weighted greeks
                netDelta += (strike.callGreeks.delta * strike.callOI) - (strike.putGreeks.delta * strike.putOI);
                netGamma += (strike.callGreeks.gamma * strike.callOI) + (strike.putGreeks.gamma * strike.putOI);
                netVega += (strike.callGreeks.vega * strike.callOI) + (strike.putGreeks.vega * strike.putOI);
                netTheta += (strike.callGreeks.theta * strike.callOI) + (strike.putGreeks.theta * strike.putOI);
                gammaExposure += strike.callGreeks.gamma * strike.callOI * strike.value * strike.value * 0.01;
            }
        });
        return { netDelta, netGamma, netVega, netTheta, gammaExposure };
    }
}
exports.default = OptionGreeksRule;
