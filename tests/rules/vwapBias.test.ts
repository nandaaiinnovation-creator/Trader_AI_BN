import VWAPBiasRule from '../../src/services/rules/vwapBias';
import { RuleContext } from '../../src/types/rules';

describe('VWAP Bias rule (TS)', () => {
  test('vwapBiasRule detects bullish bias when price above VWAP+deviation', async () => {
    const candles = [{ open: 100, high: 110, low: 99, close: 112, volume: 1000, vwap: 100 }];
    const ctx: RuleContext = { candles: candles as any, marketState: { atr: 1 }, symbol: 'BANKNIFTY' } as any;

    const rule = new VWAPBiasRule({ name: 'vwapBias', params: { vwap_dev_sigma: 1 } } as any);
    const res = await rule.evaluate(ctx);
    expect(res).toBeDefined();
    expect(typeof res.pass).toBe('boolean');
    expect(typeof res.reason).toBe('string');
    expect(res.pass).toBe(true);
    expect(/Bullish VWAP bias/i.test(res.reason)).toBe(true);
  });
});
