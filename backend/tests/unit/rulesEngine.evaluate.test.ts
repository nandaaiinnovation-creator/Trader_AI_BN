/// <reference types="jest" />
import { RulesEngine } from '../../src/services/rulesEngine';
import { BaseRule, RuleErrorType } from '../../src/services/rules/base';
import { redisClient } from '../../src/utils/helpers';

// Minimal fake rule implementations
class PassingRule extends BaseRule {
  async evaluate(_context: any): Promise<any> {
    return this.createResult(true, 1, 'Buy: passing rule');
  }
}

class ThrowingRule extends BaseRule {
  async evaluate(_context: any): Promise<any> {
    const err: any = new Error('boom');
    err.type = RuleErrorType.RULE_ERROR;
    throw err;
  }
}

describe('RulesEngine.evaluate() focused tests', () => {
  beforeEach(() => {
    // prevent actual redis calls during tests
    if (redisClient && typeof redisClient.set === 'function') {
      jest.spyOn(redisClient, 'set').mockResolvedValue(undefined as any);
    }
    if (redisClient && typeof redisClient.expire === 'function') {
      jest.spyOn(redisClient, 'expire').mockResolvedValue(undefined as any);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('happy path: produces BUY when weighted rules exceed threshold', async () => {
    const cfg: any = {
      rules: {
        r1: { enabled: true, weight: 1, params: {} },
        r2: { enabled: true, weight: 1, params: {} },
        compositeScore: { params: { signal_threshold: 0.5, cooldown_bars: 0 } }
      },
      regimeWeights: {}
    };

    const engine = new RulesEngine(cfg as any);
    // inject fake rules into private map
    (engine as any).rules = new Map();
    (engine as any).rules.set('r1', new PassingRule(cfg.rules.r1));
    (engine as any).rules.set('r2', new PassingRule(cfg.rules.r2));

    const ctx: any = { symbol: 'TEST', timeframe: '1m', regime: 'TRENDING', candles: [], marketState: {} };

    const res = await engine.evaluate(ctx);
    expect(res.signal).toBe('BUY');
    expect(res.score).toBeCloseTo(1);
    expect(Object.keys(res.firedRules)).toEqual(expect.arrayContaining(['r1', 'r2']));
  });

  test('captures rule errors and marks rule as failed without crashing', async () => {
    const cfg: any = {
      rules: {
        bad: { enabled: true, weight: 1, params: {} },
        compositeScore: { params: { signal_threshold: 0.1, cooldown_bars: 0 } }
      },
      regimeWeights: {}
    };

    const engine = new RulesEngine(cfg as any);
    (engine as any).rules = new Map();
    (engine as any).rules.set('bad', new ThrowingRule(cfg.rules.bad));

    const ctx: any = { symbol: 'ERR', timeframe: '1m', regime: 'TRENDING', candles: [], marketState: {} };

    const res = await engine.evaluate(ctx);
    // Expect no uncaught exception and signal null
    expect(res.signal).toBeNull();
    // The firedRules should include the failed rule with pass=false
    expect(res.firedRules.bad).toBeDefined();
    expect(res.firedRules.bad.pass).toBe(false);
    expect(res.firedRules.bad.errorType).toBe(RuleErrorType.RULE_ERROR);
  });

  test('cooldown suppresses repeated signals within configured window', async () => {
    const cfg: any = {
      rules: {
        r1: { enabled: true, weight: 1, params: {} },
        compositeScore: { params: { signal_threshold: 0.5, cooldown_bars: 60 } }
      },
      regimeWeights: {}
    };

    const engine = new RulesEngine(cfg as any);
    (engine as any).rules = new Map();
    (engine as any).rules.set('r1', new PassingRule(cfg.rules.r1));

    const ctx: any = { symbol: 'CD', timeframe: '1m', regime: 'TRENDING', candles: [], marketState: {} };

    const first = await engine.evaluate(ctx);
    expect(first.signal).toBe('BUY');

    // simulate immediate second evaluation within cooldown window
    const second = await engine.evaluate(ctx);
    expect(second.signal).toBeNull();
  });

  test('regimeWeights influence composite scoring', async () => {
    // Use two rules: a low-score rule (r1) and a high-score rule (r2).
    // Configure regimeWeights so TRENDING favors the low-score rule (higher weight)
    // and RANGE favors the high-score rule, producing different normalized scores.
    class LowRule extends BaseRule {
      async evaluate(_context: any): Promise<any> {
        return this.createResult(true, 0.1, 'Buy: low');
      }
    }

    class HighRule extends BaseRule {
      async evaluate(_context: any): Promise<any> {
        return this.createResult(true, 1, 'Buy: high');
      }
    }

    const cfg: any = {
      rules: {
        r1: { enabled: true, weight: 1, params: {} },
        r2: { enabled: true, weight: 1, params: {} },
        compositeScore: { params: { signal_threshold: 0.6, cooldown_bars: 0 } }
      },
      regimeWeights: {
        TRENDING: { r1: 2, r2: 1 },
        RANGE: { r1: 0.5, r2: 1 }
      }
    };

    const engine = new RulesEngine(cfg as any);
    (engine as any).rules = new Map();
    (engine as any).rules.set('r1', new LowRule(cfg.rules.r1));
    (engine as any).rules.set('r2', new HighRule(cfg.rules.r2));

    const ctxTrending: any = { symbol: 'RG', timeframe: '1m', regime: 'TRENDING', candles: [], marketState: {} };
    const ctxRange: any = { symbol: 'RG', timeframe: '1m', regime: 'RANGE', candles: [], marketState: {} };

    const resTrend = await engine.evaluate(ctxTrending);
    // TRENDING should produce a lower normalized score (favoring low-rule) -> no signal
    expect(resTrend.signal).toBeNull();

    const resRange = await engine.evaluate(ctxRange);
    // RANGE should produce a higher normalized score (favoring high-rule) -> BUY
    expect(resRange.signal).toBe('BUY');
  });
});
