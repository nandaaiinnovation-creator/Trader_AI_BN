import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class BreadthProxyRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
  this.validateConfig(['constituents_count', 'adv_decl_threshold']);
  const { adv_decl_threshold } = this.config.params;
  // constituents_count is intentionally unused in this implementation; keep param for config compatibility
  const _constituents_count = (this.config.params as any).constituents_count;
  void _constituents_count;

  const ms: any = context.marketState || {};
  const breadth = ms.breadth;
  if (!breadth) return this.createResult(false, 0, 'Breadth data not available');

  const adv = breadth.adv || 0;
  const decl = breadth.decl || 0;
    const ratio = adv / (decl || 1);
    if (ratio > adv_decl_threshold) return this.createResult(true, 1, 'Breadth bullish tilt');
    if (ratio < 1 / adv_decl_threshold) return this.createResult(true, 1, 'Breadth bearish tilt');
    return this.createResult(false, 0, 'No breadth tilt');
  }
}
