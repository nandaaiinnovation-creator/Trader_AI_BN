import RoundNumberMagnetRule from '../../src/services/rules/roundNumberMagnetRule';
import { RuleContext } from '../../src/types/rules';

describe('Round Number Magnet rule (TS)', () => {
  const candles = Array.from({ length: 10 }, (_, i) => ({ open: 250 + i, high: 251 + i, low: 249 + i, close: 250 + i, volume: 400 }));
  const ctx: RuleContext = { candles: candles as any, marketState: { atr: 20, tickSize: 0.5 }, symbol: 'BANKNIFTY' } as any;

  test('roundNumberMagnetRule detects proximity to round number', async () => {
    const rule = new RoundNumberMagnetRule({ name: 'roundNumberMagnetRule', params: { round_num_step: 10, tolerance_ticks: 5 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  expect(res.pass).toBeTruthy();
  expect(res.reason).not.toBe('');
  });
});
