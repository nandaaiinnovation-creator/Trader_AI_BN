import PreMarketMomentumRule from '../../src/services/rules/preMarketMomentumRule';
import { RuleContext } from '../../src/types/rules';

describe('PreMarket Momentum rule (TS)', () => {
  // timestamp set to market open window (09:18)
  const timestamp = new Date();
  timestamp.setHours(9, 18, 0, 0);
  const candles = [{ open: 100, high: 101, low: 99, close: 100, volume: 1000, timestamp }];

  const marketState = {
    sgxNifty: { change: 0.5 },
    globalMarkets: { sentiment: 0.2 },
    sectoralData: { bankingIndex: { change: 0.3 } },
    preMarketVolume: { ratio: 1.2 }
  };

  const ctx: RuleContext = { candles: candles as any, marketState: marketState as any, symbol: 'BANKNIFTY' } as any;

  test('preMarketMomentumRule runs and returns a result', async () => {
    const rule = new PreMarketMomentumRule({ name: 'preMarketMomentum', params: { sgx_weight: 1, global_weight: 1, sectoral_weight: 1, volume_weight: 1 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
