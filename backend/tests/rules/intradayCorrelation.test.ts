import IntradayCorrelationRule from '../../src/services/rules/intradayCorrelationRule';
import { RuleContext } from '../../src/types/rules';

describe('Intraday Correlation rule (TS)', () => {
  const now = Date.now();
  const bnCandles = Array.from({ length: 30 }, (_, i) => ({ timestamp: new Date(now - (30 - i) * 60000).toISOString(), close: 100 + i }));
  const niftyCandles = Array.from({ length: 30 }, (_, i) => ({ timestamp: new Date(now - (30 - i) * 60000).toISOString(), close: 200 + i * 0.8 }));

  const ctx: RuleContext = { candles: bnCandles as any, marketState: { nifty: { candles: niftyCandles } } as any, symbol: 'BANKNIFTY' } as any;

  test('intradayCorrelationRule runs and returns a result', async () => {
    const rule = new IntradayCorrelationRule({ name: 'intradayCorrelationRule', params: { correlation_window: 20, divergence_threshold: 0.01, confirmation_bars: 3 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
