import { Router, Request, Response } from 'express';
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
