"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class SpreadGuardRule extends base_1.BaseRule {
    async evaluate(context) {
        this.validateConfig(['max_spread_pct', 'min_liquidity']);
        const { max_spread_pct, min_liquidity } = this.config.params;
        const ms = context.marketState || {};
        const spread = ms.spread_pct;
        const liquidity = ms.liquidity;
        if (spread === undefined)
            return this.createResult(false, 0, 'Spread data not available');
        if (spread > max_spread_pct || (liquidity !== undefined && liquidity < min_liquidity)) {
            return this.createResult(false, 0, 'Spread/slippage guard tripped');
        }
        return this.createResult(false, 0, 'Spread acceptable');
    }
}
exports.default = SpreadGuardRule;
