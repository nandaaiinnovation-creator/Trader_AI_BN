"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesEngine = void 0;
const base_1 = require("./rules/base");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
class RulesEngine {
    constructor(config) {
        this.rules = new Map();
        this.lastSignalTime = new Map();
        this.config = config;
        this.initializeRules();
    }
    initializeRules() {
        // Load and instantiate all rule classes dynamically.
        // Support webpack's require.context if available, otherwise fall back to Node fs-based loader.
        try {
            // @ts-ignore - require.context may be injected by bundlers
            if (typeof require.context === 'function') {
                const ruleFiles = require.context('./rules', false, /\.ts$/);
                ruleFiles.keys().forEach((key) => {
                    const ruleName = key.replace('./', '').replace('.ts', '');
                    if (ruleName === 'base')
                        return;
                    const RuleClass = ruleFiles(key).default;
                    const cfg = this.config.rules ? this.config.rules[ruleName] : this.config[ruleName];
                    this.rules.set(ruleName, new RuleClass(cfg));
                });
                return;
            }
        }
        catch (e) {
            // ignore and fall back to fs loader
        }
        // Node runtime loader
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = require('path');
        const rulesDir = path.resolve(__dirname, 'rules');
        if (!fs.existsSync(rulesDir))
            return;
        // Determine whether we're running from compiled dist or from src (ts-node)
        const runningFromDist = __dirname.includes(`${path.sep}dist${path.sep}`) || __dirname.endsWith(`${path.sep}dist`);
        const extPreference = runningFromDist ? ['.js', '.ts'] : ['.ts', '.js'];
        const files = fs.readdirSync(rulesDir).filter((f) => extPreference.some(ext => f.endsWith(ext)));
        for (const file of files) {
            const name = file.replace(/\.ts$|\.js$/, '');
            if (name === 'base')
                continue;
            try {
                // Try preferred extension first, then fallback
                let mod = null;
                for (const ext of extPreference) {
                    const candidate = path.join(rulesDir, `${name}${ext}`);
                    try {
                        if (fs.existsSync(candidate)) {
                            mod = require(candidate);
                            break;
                        }
                    }
                    catch (innerErr) {
                        // continue to next ext
                    }
                }
                if (!mod)
                    continue;
                const RuleClass = mod && mod.default ? mod.default : mod;
                if (!RuleClass)
                    continue;
                const cfg = this.config.rules ? this.config.rules[name] : this.config[name];
                this.rules.set(name, new RuleClass(cfg));
            }
            catch (err) {
                // log and continue
                try {
                    logger_1.logger.warn(`Failed to load rule ${name}: ${err && err.message ? err.message : String(err)}`);
                }
                catch (e) { /* noop */ }
            }
        }
    }
    async evaluate(context) {
        const results = {};
        let compositeScore = 0;
        let totalWeight = 0;
        // Apply regime-specific weights
        const weights = this.config.regimeWeights ? this.config.regimeWeights[context.regime] : {};
        // Evaluate each enabled rule
        for (const [ruleName, rule] of this.rules) {
            const ruleCfg = this.config.rules ? this.config.rules[ruleName] : undefined;
            if (!ruleCfg || !ruleCfg.enabled)
                continue;
            try {
                const result = await rule.evaluate(context);
                if (result.pass) {
                    const weight = (weights && weights[ruleName]) || ruleCfg.weight;
                    compositeScore += result.score * weight;
                    totalWeight += weight;
                }
                results[ruleName] = result;
            }
            catch (err) {
                // Classify known error types
                const type = err && err.type ? err.type : base_1.RuleErrorType.RULE_ERROR;
                const reason = err && err.message ? err.message : String(err);
                results[ruleName] = {
                    pass: false,
                    score: 0,
                    reason: reason,
                    errorType: type
                };
                logger_1.logger.error({ message: `Rule ${ruleName} evaluation failed: ${reason}`, type });
            }
        }
        // Normalize composite score
        const normalizedScore = totalWeight > 0 ? compositeScore / totalWeight : 0;
        // Apply cooldown and duplicate suppression
        const symbol = context.symbol;
        const now = Date.now();
        const lastSignal = this.lastSignalTime.get(symbol) || 0;
        const compositeCfg = this.config.rules ? this.config.rules['compositeScore'] : undefined;
        const cooldownMs = compositeCfg && compositeCfg.params && compositeCfg.params.cooldown_bars ? compositeCfg.params.cooldown_bars * 60000 : 0;
        if (now - lastSignal < cooldownMs) {
            return { signal: null, score: normalizedScore, firedRules: results };
        }
        // Cache latest state in Redis
        await this.cacheState(context, normalizedScore, results);
        // Generate signal if threshold met
        let signal = null;
        const signalThreshold = compositeCfg && compositeCfg.params && compositeCfg.params.signal_threshold ? compositeCfg.params.signal_threshold : 0.5;
        if (normalizedScore >= signalThreshold) {
            signal = this.determineDirection(context, results);
            if (signal) {
                this.lastSignalTime.set(symbol, now);
            }
        }
        return { signal, score: normalizedScore, firedRules: results };
    }
    determineDirection(context, results) {
        // Count bullish vs bearish rules
        let bullish = 0;
        let bearish = 0;
        for (const result of Object.values(results)) {
            if (result.reason.toLowerCase().includes('buy'))
                bullish++;
            if (result.reason.toLowerCase().includes('sell'))
                bearish++;
        }
        // Require clear directional bias
        if (bullish > bearish * 1.5)
            return 'BUY';
        if (bearish > bullish * 1.5)
            return 'SELL';
        return null;
    }
    async cacheState(context, score, results) {
        const key = `rules:ctx:${context.symbol}`;
        const state = {
            timestamp: new Date().toISOString(),
            timeframe: context.timeframe,
            regime: context.regime,
            score,
            results
        };
        await helpers_1.redisClient.set(key, JSON.stringify(state));
        await helpers_1.redisClient.expire(key, 300); // 5 minute TTL
    }
    // Helper methods for rules to use
    static getCandleDirection(candles, lookback = 3) {
        const subset = candles.slice(-lookback);
        const closes = subset.map(c => c.close);
        const highs = subset.map(c => c.high);
        const lows = subset.map(c => c.low);
        const highsIncreasing = highs.every((h, i) => i === 0 || h >= highs[i - 1]);
        const lowsIncreasing = lows.every((l, i) => i === 0 || l >= lows[i - 1]);
        const highsDecreasing = highs.every((h, i) => i === 0 || h <= highs[i - 1]);
        const lowsDecreasing = lows.every((l, i) => i === 0 || l <= lows[i - 1]);
        if (highsIncreasing && lowsIncreasing)
            return 'up';
        if (highsDecreasing && lowsDecreasing)
            return 'down';
        return 'sideways';
    }
    static getBodySize(candle) {
        return Math.abs(candle.close - candle.open);
    }
    static getUpperWick(candle) {
        return candle.high - Math.max(candle.open, candle.close);
    }
    static getLowerWick(candle) {
        return Math.min(candle.open, candle.close) - candle.low;
    }
    static isInsideBar(current, previous) {
        return current.high <= previous.high && current.low >= previous.low;
    }
    static isEngulfing(current, previous) {
        const currentBody = Math.abs(current.close - current.open);
        const previousBody = Math.abs(previous.close - previous.open);
        const isBullish = current.close > current.open && current.close >= previous.high;
        const isBearish = current.close < current.open && current.close <= previous.low;
        return currentBody > previousBody && (isBullish || isBearish);
    }
}
exports.RulesEngine = RulesEngine;
