import SectorRotationRule from '../../src/services/rules/sectorRotationRule';
import { RuleContext } from '../../src/types/rules';

describe('Sector Rotation rule (TS)', () => {
  const candles = [{ open: 100, high: 101, low: 99, close: 100, volume: 1000 }];
  const sectoralData = {
    psuBanks: { history: [100, 101, 102, 103, 104] },
    privateBanks: { history: [100, 102, 103, 105, 107] }
  };
  const ctx: RuleContext = { candles: candles as any, marketState: { sectoralData }, symbol: 'BANKNIFTY' } as any;

  test('sectorRotationRule runs and returns a result', async () => {
    const rule = new SectorRotationRule({ name: 'sectorRotation', params: { momentum_window: 3, divergence_threshold: 0.01 } } as any);
  const res = await rule.evaluate(ctx);
  expect(res).toBeDefined();
  expect(typeof res.pass).toBe('boolean');
  expect(typeof res.reason).toBe('string');
  });
});
