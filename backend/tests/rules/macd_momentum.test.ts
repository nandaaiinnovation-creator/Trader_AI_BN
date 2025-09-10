import MACDCrossRule from '../../src/services/rules/macdCrossRule';
import MomentumThresholdRule from '../../src/services/rules/momentumThresholdRule';
import { RuleContext } from '../../src/types/rules';

describe('MACD-related rules with insufficient data (ts-jest)', () => {
	const shortCandles = Array.from({ length: 10 }, (_, i) => ({
		open: 100 + i,
		high: 101 + i,
		low: 99 + i,
		close: 100 + i,
		volume: 1000
	}));

	const ctx: RuleContext = {
		candles: shortCandles as any,
		marketState: {} as any,
		symbol: 'BANKNIFTY'
	} as any;

	test('macdCrossRule should return insufficient data result and not throw (TS)', async () => {
		const rule = new MACDCrossRule({ name: 'macdCrossRule', params: { fast: 12, slow: 26, signal: 9, min_hist_slope: 0.001 } } as any);
		const res = await rule.evaluate(ctx);
		expect(res.pass).toBe(false);
		expect(typeof res.reason).toBe('string');
	});

	test('momentumThresholdRule should return insufficient data result and not throw (TS)', async () => {
		const rule = new MomentumThresholdRule({ name: 'momentumThresholdRule', params: { momentum_period: 12, threshold_mult: 1.5, consec_bars: 3 } } as any);
		const res = await rule.evaluate(ctx);
		expect(res.pass).toBe(false);
		expect(typeof res.reason).toBe('string');
	});
});

