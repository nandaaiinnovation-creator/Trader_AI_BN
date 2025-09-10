import { RuleResult, RuleContext, RuleConfig } from '../../types/rules';

export enum RuleErrorType {
  CONFIG_MISSING = 'CONFIG_MISSING',
  DATA_MISSING = 'DATA_MISSING',
  RULE_ERROR = 'RULE_ERROR'
}

export abstract class BaseRule {
  protected config: RuleConfig;

  constructor(config: RuleConfig) {
    this.config = config;
  }

  abstract evaluate(context: RuleContext): Promise<RuleResult>;

  protected validateConfig(required: string[]): void {
    for (const param of required) {
      if (this.config.params[param] === undefined) {
        const err: any = new Error(`Missing required parameter: ${param}`);
        err.type = RuleErrorType.CONFIG_MISSING;
        throw err;
      }
    }
  }

  protected createResult(pass: boolean, score: number, reason: string): RuleResult {
    return { pass, score, reason };
  }
}
