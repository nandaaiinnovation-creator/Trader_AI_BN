import BollingerSqueezeRule from '../../src/services/rules/bollingerSqueezeRule';
import { RuleContext } from '../../src/types/rules';

describe('Bollinger Squeeze rule (TS)', () => {
  const closes = [100, 100.5, 99.8, 101, 102, 101.5, 103, 104, 102, 101, 100, 99, 100, 98, 97, 96, 95, 94, 95, 96];
  const candles = closes.map((c) => ({ open: c - 0.5, high: c + 0.5, low: c - 1, close: c, volume: 1000 }));
  const ctx: RuleContext = { candles: candles as any, marketState: {}, symbol: 'BANKNIFTY' } as any;

  test('bollingerSqueezeRule runs and returns a result', async () => {
    const rule = new BollingerSqueezeRule({ name: 'bollingerSqueezeRule', params: { bb_len: 14, bb_sigma: 2, min_bandwidth: 0.01, follow_through_bars: 2 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
