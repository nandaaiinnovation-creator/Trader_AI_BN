import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { zScore } from '../../utils/indicators';

export default class IVCrushRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['iv_lookback', 'z_threshold']);
    const { iv_lookback, z_threshold } = this.config.params;

    const ivSeries = (context.marketState as any)?.optionIVs || [];
    if (!ivSeries || ivSeries.length < iv_lookback) return this.createResult(false, 0, 'Insufficient IV history');

    const zs = zScore(ivSeries, iv_lookback);
    const last = zs[zs.length - 1] || 0;
    const z = Math.abs(last);

    // include the computed z (absolute z-score) in the returned result so tests
    // and consumers can inspect the magnitude of the IV deviation.
    if (last <= -z_threshold) {
      const base = this.createResult(true, 1, 'IV crush detected');
      return { ...base, z } as any;
    }

    if (last >= z_threshold) {
      const base = this.createResult(true, 1, 'IV expansion detected');
      return { ...base, z } as any;
    }

    const base = this.createResult(false, 0, 'No IV gap');
    return { ...base, z } as any;
  }
}
