"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rules_1 = __importDefault(require("../config/rules"));
const rulesEngine_1 = require("../services/rulesEngine");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    const samplePath = path.resolve(__dirname, '../../scripts/sample_candles.json');
    const raw = fs.readFileSync(samplePath, 'utf8');
    const candles = JSON.parse(raw);
    const engine = new rulesEngine_1.RulesEngine(rules_1.default);
    const context = {
        symbol: 'BANKNIFTY',
        timeframe: '5m',
        candles: candles.map(c => ({
            timestamp: new Date(c.t),
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
            volume: c.v
        })),
        regime: 'TRENDING',
        marketState: {}
    };
    const results = {};
    for (const [name, rule] of engine.rules) {
        try {
            const res = await rule.evaluate(context);
            results[name] = res;
        }
        catch (err) {
            results[name] = { pass: false, score: 0, reason: 'error ' + (err && err.message) };
        }
    }
    console.log('Rule evaluation results:');
    console.dir(results, { depth: 2 });
}
if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
exports.default = main;
