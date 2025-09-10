import NewsFilterRule from '../../src/services/rules/newsFilterRule';
import { RuleContext } from '../../src/types/rules';

describe('News Filter rule (TS)', () => {
  const candles = [{ open: 100, high: 101, low: 99, close: 100, volume: 1000 }];
  const marketState = { recentNews: [{ headline: 'Something', sentiment: -0.2 }, { headline: 'OK', sentiment: 0 }] };
  const ctx: RuleContext = { candles: candles as any, marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('newsFilterRule runs and returns a result', async () => {
    const rule = new NewsFilterRule({ name: 'newsFilter', params: { ignore_on_news: true, sentiment_threshold: -0.5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
