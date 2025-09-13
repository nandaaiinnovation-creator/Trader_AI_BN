import { RuleContext, RuleResult, CandleData } from '../types/rules';
import { BaseRule, RuleErrorType } from './rules/base';
import { RulesConfig } from '../config/rules';
import { logger } from '../utils/logger';
import { redisClient } from '../utils/helpers';
import SignalOrchestrator from './signalOrchestrator';

// Allow Node-style require in mixed TS/JS runtime
declare const require: any;
declare const __dirname: string;

export class RulesEngine {
  private rules: Map<string, BaseRule> = new Map();
  private config: RulesConfig;
  private lastSignalTime: Map<string, number> = new Map();
  private orchestrator?: SignalOrchestrator;
  
  constructor(config: RulesConfig, orchestrator?: SignalOrchestrator) {
    this.config = config;
    this.orchestrator = orchestrator;
    this.initializeRules();
  }

  private initializeRules() {
    // Load and instantiate all rule classes dynamically.
    // Support webpack's require.context if available, otherwise fall back to Node fs-based loader.
    try {
      // require.context may be present in some bundlers; prefer dynamic context when available
      if (typeof (require as any).context === 'function') {
        const ruleFiles = (require as any).context('./rules', false, /\.ts$/);
        ruleFiles.keys().forEach((key: string) => {
          const ruleName = key.replace('./', '').replace('.ts', '');
          if (ruleName === 'base') return;
          const RuleClass = ruleFiles(key).default;
          const cfg = (this.config as any).rules ? (this.config as any).rules[ruleName] : (this.config as any)[ruleName];
          this.rules.set(ruleName, new RuleClass(cfg));
        });
        return;
      }
    } catch (e) {
      // ignore and fall back to fs loader
    }

    // Node runtime loader
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');
    const rulesDir = path.resolve(__dirname, 'rules');
    if (!fs.existsSync(rulesDir)) return;

    // Determine whether we're running from compiled dist or from src (ts-node)
    const runningFromDist = __dirname.includes(`${path.sep}dist${path.sep}`) || __dirname.endsWith(`${path.sep}dist`);
    const extPreference = runningFromDist ? ['.js', '.ts'] : ['.ts', '.js'];

    const files = fs.readdirSync(rulesDir).filter((f: string) => extPreference.some(ext => f.endsWith(ext)));
    for (const file of files) {
      const name = file.replace(/\.ts$|\.js$/, '');
      if (name === 'base') continue;
      try {
        // Try preferred extension first, then fallback
        let mod: any = null;
        for (const ext of extPreference) {
          const candidate = path.join(rulesDir, `${name}${ext}`);
          try {
            if (fs.existsSync(candidate)) {
              mod = require(candidate);
              break;
            }
          } catch (innerErr) {
            // continue to next ext
          }
        }
        if (!mod) continue;
        const RuleClass = mod && mod.default ? mod.default : mod;
        if (!RuleClass) continue;
        const cfg = (this.config as any).rules ? (this.config as any).rules[name] : (this.config as any)[name];
        this.rules.set(name, new RuleClass(cfg));
      } catch (err: any) {
        // log and continue
        try { logger.warn(`Failed to load rule ${name}: ${err && err.message ? err.message : String(err)}`); } catch (e) { /* noop */ }
      }
    }
  }

  public async evaluate(context: RuleContext): Promise<{
    signal: 'BUY' | 'SELL' | null;
    score: number;
    firedRules: Record<string, RuleResult>;
  }> {
    const results: Record<string, RuleResult> = {};
    let compositeScore = 0;
    let totalWeight = 0;

  // Apply regime-specific weights
    const weights = (this.config as any).regimeWeights ? (this.config as any).regimeWeights[context.regime] : {};

    // Evaluate each enabled rule
    for (const [ruleName, rule] of this.rules) {
  const ruleCfg = (this.config as any).rules ? (this.config as any).rules[ruleName] : undefined;
  if (!ruleCfg || !ruleCfg.enabled) continue;

      try {
        const result = await rule.evaluate(context);
        if (result.pass) {
          const weight = (weights && weights[ruleName]) || ruleCfg.weight;
          compositeScore += result.score * weight;
          totalWeight += weight;
        }
        results[ruleName] = result;
      } catch (err: any) {
        // Classify known error types
        const type = err && err.type ? err.type : RuleErrorType.RULE_ERROR;
        const reason = err && err.message ? err.message : String(err);
        results[ruleName] = {
          pass: false,
          score: 0,
          reason: reason,
          errorType: type
        } as RuleResult;
        logger.error({ message: `Rule ${ruleName} evaluation failed: ${reason}`, type });
      }
    }

    // Normalize composite score
    const normalizedScore = totalWeight > 0 ? compositeScore / totalWeight : 0;

    // Apply cooldown and duplicate suppression
    const symbol = context.symbol;
    const now = Date.now();
    const lastSignal = this.lastSignalTime.get(symbol) || 0;
  const compositeCfg = (this.config as any).rules ? (this.config as any).rules['compositeScore'] : undefined;
  const cooldownMs = compositeCfg && compositeCfg.params && compositeCfg.params.cooldown_bars ? compositeCfg.params.cooldown_bars * 60000 : 0;

    if (now - lastSignal < cooldownMs) {
      return { signal: null, score: normalizedScore, firedRules: results };
    }

    // Cache latest state in Redis
    await this.cacheState(context, normalizedScore, results);

    // Generate signal if threshold met
    let signal: 'BUY' | 'SELL' | null = null;
  const signalThreshold = compositeCfg && compositeCfg.params && compositeCfg.params.signal_threshold ? compositeCfg.params.signal_threshold : 0.5;
    if (normalizedScore >= signalThreshold) {
      signal = this.determineDirection(context, results);
      if (signal) {
        this.lastSignalTime.set(symbol, now);
      }
    }

    // Non-blocking: forward to orchestrator if configured
    if (signal && this.orchestrator) {
      const payload = {
        symbol: symbol,
        timeframe: context.timeframe,
        signal,
        score: normalizedScore,
        firedRules: results,
        timestamp: now,
      };
      // don't await, but log on error
      try {
        // explicit any cast avoided; orchestrator accepts a compatible shape
        this.orchestrator.handle(payload as any).catch((err: any) => {
          try { logger.warn(`orchestrator.handle failed: ${err && err.message ? err.message : String(err)}`); } catch (e) { /* noop */ }
        });
      } catch (err: any) {
        logger.warn({ message: 'Failed to forward to orchestrator', err: err && err.message ? err.message : String(err) });
      }
    }

    return { signal, score: normalizedScore, firedRules: results };
  }

  private determineDirection(context: RuleContext, results: Record<string, RuleResult>): 'BUY' | 'SELL' | null {
    // Count bullish vs bearish rules
    let bullish = 0;
    let bearish = 0;

    for (const result of Object.values(results)) {
      if (result.reason.toLowerCase().includes('buy')) bullish++;
      if (result.reason.toLowerCase().includes('sell')) bearish++;
    }

    // Require clear directional bias
    if (bullish > bearish * 1.5) return 'BUY';
    if (bearish > bullish * 1.5) return 'SELL';
    return null;
  }

  private async cacheState(
    context: RuleContext,
    score: number,
    results: Record<string, RuleResult>
  ) {
    const key = `rules:ctx:${context.symbol}`;
    const state = {
      timestamp: new Date().toISOString(),
      timeframe: context.timeframe,
      regime: context.regime,
      score,
      results
    };

    await redisClient.set(key, JSON.stringify(state));
    await redisClient.expire(key, 300); // 5 minute TTL
  }

  // Helper methods for rules to use
  public static getCandleDirection(candles: CandleData[], lookback: number = 3): 'up' | 'down' | 'sideways' {
    const subset = candles.slice(-lookback);
    const closes = subset.map(c => c.close);
    const highs = subset.map(c => c.high);
    const lows = subset.map(c => c.low);

    const highsIncreasing = highs.every((h, i) => i === 0 || h >= highs[i - 1]);
    const lowsIncreasing = lows.every((l, i) => i === 0 || l >= lows[i - 1]);
    const highsDecreasing = highs.every((h, i) => i === 0 || h <= highs[i - 1]);
    const lowsDecreasing = lows.every((l, i) => i === 0 || l <= lows[i - 1]);

    if (highsIncreasing && lowsIncreasing) return 'up';
    if (highsDecreasing && lowsDecreasing) return 'down';
    return 'sideways';
  }

  public static getBodySize(candle: CandleData): number {
    return Math.abs(candle.close - candle.open);
  }

  public static getUpperWick(candle: CandleData): number {
    return candle.high - Math.max(candle.open, candle.close);
  }

  public static getLowerWick(candle: CandleData): number {
    return Math.min(candle.open, candle.close) - candle.low;
  }

  public static isInsideBar(current: CandleData, previous: CandleData): boolean {
    return current.high <= previous.high && current.low >= previous.low;
  }

  public static isEngulfing(current: CandleData, previous: CandleData): boolean {
    const currentBody = Math.abs(current.close - current.open);
    const previousBody = Math.abs(previous.close - previous.open);
    const isBullish = current.close > current.open && current.close >= previous.high;
    const isBearish = current.close < current.open && current.close <= previous.low;
    return currentBody > previousBody && (isBullish || isBearish);
  }
}
