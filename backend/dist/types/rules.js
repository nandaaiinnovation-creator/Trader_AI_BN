"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingRegime = void 0;
var TradingRegime;
(function (TradingRegime) {
    TradingRegime["TRENDING"] = "TRENDING";
    TradingRegime["RANGE"] = "RANGE";
    TradingRegime["MEAN_REVERT"] = "MEAN_REVERT";
})(TradingRegime || (exports.TradingRegime = TradingRegime = {}));
// MarketState is imported from './market' which contains the richer structure used by rules
