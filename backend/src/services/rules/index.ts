import EventEmitter from 'events';
import createAppConnection from '../../db/index';
import { RuleConfig } from '../../db/entities/ruleConfig';

export type RuleEvaluationResult = {
  id: string;
  name: string;
  passed: boolean;
  score?: number;
  meta?: Record<string, unknown>;
};

export type RuleFn = (input: any, config?: any) => Promise<RuleEvaluationResult> | RuleEvaluationResult;

export class RulesEngine extends EventEmitter {
  private rules: Map<string, RuleFn> = new Map();

  registerRule(id: string, fn: RuleFn) {
    if (this.rules.has(id)) throw new Error(`Rule already registered: ${id}`);
    this.rules.set(id, fn);
  }

  async evaluateAll(input: any): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];
    for (const [id, fn] of this.rules.entries()) {
      try {
        const r = await Promise.resolve(fn(input));
        results.push(r);
      } catch (err) {
        results.push({ id, name: id, passed: false, meta: { error: `${err}` } });
      }
    }
    this.emit('evaluated', results);
    return results;
  }
}

export default RulesEngine;

export async function createRulesEngineFromDb(): Promise<RulesEngine> {
  const conn = await createAppConnection();
  const repo = conn.getRepository(RuleConfig);
  const configs = await repo.find();

  const engine = new RulesEngine();

  for (const cfg of configs) {
    // Register a placeholder rule fn. Real rule logic will be registered by rule implementations using engine.registerRule
    const id = cfg.name;
  engine.registerRule(id, async (_input: any) => ({ id, name: id, passed: !!cfg.enabled, score: cfg.enabled ? 1 : 0, meta: { fromDb: true } }));
  }

  return engine;
}
