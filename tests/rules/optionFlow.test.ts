import OptionFlowRule from '../../src/services/rules/optionFlowRule';
import { RuleContext } from '../../src/types/rules';

describe('Option Flow rule (TS)', () => {
  const candles = Array.from({ length: 20 }, (_, i) => ({ open: 500 + i, high: 501 + i, low: 499 + i, close: 500 + i, volume: 1000 }));

  const optionChain = [
    { strike: 510, callOI: 1000, putOI: 800, callVolume: 200, putVolume: 50, callOIChange: 120, putOIChange: 10 },
    { strike: 490, callOI: 600, putOI: 1200, callVolume: 50, putVolume: 300, callOIChange: 5, putOIChange: 150 }
  ];

  const ctx: RuleContext = { candles: candles as any, marketState: { optionChain }, symbol: 'BANKNIFTY' } as any;

  test('optionFlowRule runs and returns a result', async () => {
    const rule = new OptionFlowRule({ name: 'optionFlowRule', params: { strikes_range: 0.1, min_oi_change: 10, volume_threshold: 50 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
