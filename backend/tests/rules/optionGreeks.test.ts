import OptionGreeksRule from '../../src/services/rules/optionGreeksRule';
import { RuleContext } from '../../src/types/rules';

describe('Option Greeks rule (TS)', () => {
  const candles = Array.from({ length: 10 }, (_, i) => ({ open: 400 + i, high: 401 + i, low: 399 + i, close: 400 + i, volume: 1000 }));

  const optionChain = [
    { value: 410, callGreeks: { delta: 0.5, gamma: 0.01, vega: 0.2, theta: -0.01 }, putGreeks: { delta: -0.4, gamma: 0.01, vega: 0.15, theta: -0.01 }, callOI: 1000, putOI: 800 },
    { value: 390, callGreeks: { delta: 0.6, gamma: 0.02, vega: 0.25, theta: -0.02 }, putGreeks: { delta: -0.3, gamma: 0.02, vega: 0.1, theta: -0.02 }, callOI: 500, putOI: 1200 }
  ];

  const ctx: RuleContext = { candles: candles as any, marketState: { optionChain }, symbol: 'BANKNIFTY' } as any;

  test('optionGreeksRule runs and returns result', async () => {
    const rule = new OptionGreeksRule({ name: 'optionGreeksRule', params: { delta_threshold: 100, gamma_threshold: 10000, vega_threshold: 1000 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeDefined();
  expect(res.reason).toBeDefined();
  });
});
