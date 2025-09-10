import { BaseRule } from './base';
import { RuleContext, RuleResult } from '../../types/rules';

export default class NewsFilterRule extends BaseRule {
  async evaluate(context: RuleContext): Promise<RuleResult> {
    this.validateConfig(['ignore_on_news', 'sentiment_threshold']);
    const { ignore_on_news, sentiment_threshold } = this.config.params;

    const ms: any = context.marketState || {};
    const news = ms.recentNews || [];
    if (!news || news.length === 0) return this.createResult(false, 0, 'No recent news');

    const worst = Math.min(...news.map((n: any) => n.sentiment || 0));
    if (ignore_on_news && worst < sentiment_threshold) {
      return this.createResult(false, 0, 'News filter blocked due to negative news');
    }

    return this.createResult(false, 0, 'News acceptable');
  }
}
