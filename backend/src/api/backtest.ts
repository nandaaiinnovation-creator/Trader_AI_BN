import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
const router = Router();

// POST /api/backtest/demo
// Deterministic demo backtest returning a fixed summary for UI wiring
router.post('/demo', async (_req: Request, res: Response) => {
	// Static payload keeps CI and local predictable; replace in Stage 6
	const result = {
		strategy: 'demo-baseline',
		dataset: 'seed/demo-candles.json',
		trades: 12,
		winRate: 58.3,
		pnl: 12750,
		avgRR: 1.45,
		maxDD: -3.8,
		durationSec: 2.1,
		generatedAt: new Date().toISOString(),
	};
	res.json({ data: result });
});

export default router;

// -------------------------
// Stage 6–8: Backtest v2
// -------------------------

type Candle = { time: number; open: number; high: number; low: number; close: number };
type GroupName = 'Price Action' | 'Momentum' | 'Trend' | 'Volatility' | 'Sentiment';

function loadSeedCandles(): Candle[] {
	// Resolve relative to compiled dist path: dist/api -> ../../seed/demo-candles.json
	const p = path.resolve(__dirname, '../../seed', 'demo-candles.json');
	if (!fs.existsSync(p)) return [];
	try {
		const raw = fs.readFileSync(p, 'utf-8');
		const arr = JSON.parse(raw);
		if (Array.isArray(arr)) return arr as Candle[];
	} catch (_) {}
	return [];
}

function isoFromUnix(unixSec: number): string {
	return new Date(unixSec * 1000).toISOString();
}

function computeMetrics(pnls: number[]): { win_rate: number; profit_factor: number; expectancy: number; max_drawdown: number; sharpe: number; pnl: number } {
	const total = pnls.reduce((a, b) => a + b, 0);
	const wins = pnls.filter((x) => x > 0);
	const losses = pnls.filter((x) => x < 0);
	const winRate = pnls.length ? wins.length / pnls.length : 0;
	const grossProfit = wins.reduce((a, b) => a + b, 0);
	const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
	const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (wins.length > 0 ? Infinity : 0);
	const avgWin = wins.length ? grossProfit / wins.length : 0;
	const avgLoss = losses.length ? (grossLoss / losses.length) : 0; // positive magnitude
	const lossRate = 1 - winRate;
	const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

	// Max drawdown on cumulative equity
	const curve: number[] = [];
	let cum = 0;
	for (const p of pnls) { cum += p; curve.push(cum); }
	let peak = -Infinity;
	let maxDD = 0;
	for (const eq of curve) {
		if (eq > peak) peak = eq;
		const dd = eq - peak; // negative or zero
		if (dd < maxDD) maxDD = dd;
	}

	// Sharpe ratio (naive): mean(pnl) / stdev(pnl) * sqrt(n), risk-free ~ 0
	const n = pnls.length;
	const mean = n ? total / n : 0;
	const variance = n ? pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n : 0;
	const stdev = Math.sqrt(variance);
	const sharpe = stdev > 0 ? (mean / stdev) * Math.sqrt(n) : 0;

	return {
		win_rate: Number.isFinite(winRate) ? winRate : 0,
		profit_factor: Number.isFinite(profitFactor) ? profitFactor : 0,
		expectancy: Number.isFinite(expectancy) ? expectancy : 0,
		max_drawdown: maxDD, // negative number
		sharpe: Number.isFinite(sharpe) ? sharpe : 0,
		pnl: total,
	};
}

function simulateBacktest(candles: Candle[], timeframe: string, toggles: { global?: boolean; groups?: Record<string, boolean> }) {
	const groups: GroupName[] = ['Price Action', 'Momentum', 'Trend', 'Volatility', 'Sentiment'];
	const globalOn = toggles.global !== false; // default on
	const groupOn: Record<GroupName, boolean> = {
		'Price Action': toggles.groups?.['Price Action'] ?? true,
		'Momentum': toggles.groups?.['Momentum'] ?? true,
		'Trend': toggles.groups?.['Trend'] ?? true,
		'Volatility': toggles.groups?.['Volatility'] ?? true,
		'Sentiment': toggles.groups?.['Sentiment'] ?? true,
	} as Record<GroupName, boolean>;

	if (!globalOn) {
		return { overall: { win_rate: 0, profit_factor: 0, expectancy: 0, max_drawdown: 0, sharpe: 0, pnl: 0 }, groups: {}, equity_curve: [], trades: [] };
	}

	const trades: { time: string; type: 'BUY'|'SELL'; price: number; exit_price: number; pnl: number; rules_triggered: string[]; group: GroupName }[] = [];

	// Deterministic trade generation: compare consecutive closes, enter at next open, exit at next close
	for (let i = 1; i < candles.length; i++) {
		const prev = candles[i - 1];
		const cur = candles[i];
		const change = cur.close - prev.close;
		const group = groups[i % groups.length];
		if (!groupOn[group]) continue; // respect group toggles
		if (change === 0) continue;
		const isUp = change > 0;
		const type = isUp ? 'BUY' : 'SELL';
		const entry = cur.open;
		const exit = cur.close;
		const pnl = isUp ? (exit - entry) : (entry - exit);
		trades.push({ time: isoFromUnix(cur.time), type, price: entry, exit_price: exit, pnl, rules_triggered: [group.replace(/\s/g, '') + 'Heuristic'], group });
	}

	// Equity curve
	let equity = 0;
	const equity_curve = trades.map((t) => { equity += t.pnl; return { time: t.time, equity: equity }; });

	// Overall metrics
	const overall = computeMetrics(trades.map(t => t.pnl));

	// Per-group metrics
	const groupsOut: Record<string, any> = {};
	for (const g of groups) {
		const t = trades.filter(tr => tr.group === g);
		const m = computeMetrics(t.map(x => x.pnl));
		groupsOut[g] = { win_rate: m.win_rate, profit_factor: m.profit_factor, pnl: m.pnl };
	}

	return {
		overall,
		groups: groupsOut,
		equity_curve,
		trades: trades.map(({ group, ...rest }) => rest),
		meta: { timeframe, count: trades.length }
	};
}

// POST /api/backtest/run
// Body: { timeframe: '3m'|'5m'|'15m', toggles: { global?: boolean, groups?: { 'Price Action'?: boolean, 'Momentum'?: boolean, 'Trend'?: boolean, 'Volatility'?: boolean, 'Sentiment'?: boolean } } }
router.post('/run', async (req: Request, res: Response) => {
	if (process.env.BACKTEST_V2_ENABLED !== 'true') {
		return res.status(404).json({ error: 'backtest_v2_disabled' });
	}
	try {
		const timeframe = typeof req.body?.timeframe === 'string' ? req.body.timeframe : '5m';
		const toggles = typeof req.body?.toggles === 'object' && req.body?.toggles ? req.body.toggles : {};
		let candles: Candle[] = [];
		// For now use seeded candles for determinism in both Demo and Live; can be replaced with DB fetch in Live later
		candles = loadSeedCandles();
		const result = simulateBacktest(candles, timeframe, toggles);
		res.json({ data: result });
	} catch (err) {
		res.status(500).json({ error: 'internal_error' });
	}
});
