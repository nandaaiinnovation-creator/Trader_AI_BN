import BreadthProxyRule from '../../src/services/rules/breadthProxyRule';
import { RuleContext } from '../../src/types/rules';

describe('BreadthProxy rule (TS)', () => {
  const marketState = { breadth: { adv: 300, decl: 100 } };
  const ctx: RuleContext = { candles: [], marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('breadthProxyRule runs and returns a result', async () => {
    const rule = new BreadthProxyRule({ name: 'breadthProxy', params: { constituents_count: 50, adv_decl_threshold: 1.5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
