import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';
import { cvd } from '../../utils/indicators';

export default class CVDImbalanceRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['cvd_window', 'z_threshold']);
    const { cvd_window, z_threshold } = this.config.params;

  const ms: any = (context.marketState as any) || {};
  const tickData = (ms.ticks || []) as any[];
    if (!tickData || tickData.length < cvd_window) return this.createResult(false, 0, 'Insufficient tick data');

    const series = cvd(tickData.slice(-cvd_window));
    const change = series[series.length - 1] - series[0];
    const absChange = Math.abs(change);
    if (absChange > z_threshold) {
      const dir = change > 0 ? 'buy' : 'sell';
      return this.createResult(true, 1, `CVD imbalance ${dir} detected (${change})`);
    }
    return this.createResult(false, 0, 'No significant CVD imbalance');
  }
}
