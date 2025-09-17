import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Demo endpoint: returns a small seeded OHLC dataset when DEMO_MODE is enabled.
router.get('/demo', (_req: Request, res: Response) => {
		try {
		if (process.env.DEMO_MODE !== 'true') {
			return res.status(404).json({ error: 'Demo mode disabled' });
		}
			// Resolve relative to compiled dist path: dist/api -> ../../seed/demo-candles.json
			const p = path.resolve(__dirname, '../../seed', 'demo-candles.json');
		if (!fs.existsSync(p)) return res.json({ candles: [] });
		const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
		return res.json({ candles: data });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to load demo candles' });
	}
});

export default router;
