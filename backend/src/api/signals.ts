import { Router, Request, Response } from 'express';
import { getManager } from 'typeorm';

const router = Router();

// GET /api/signals?limit=50&cursor=2025-09-14T12:00:00Z
// Returns recent signals ordered by ts desc. Supports a timestamp cursor (exclusive)
router.get('/', async (req: Request, res: Response) => {
	try {
		const limitRaw = Number(req.query.limit) || 50;
		const limit = Math.min(Math.max(1, limitRaw), 200);
		const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

		const params: any[] = [limit];
		let sql = 'SELECT id, symbol, rule_name, side, score, metadata, ts, created_at FROM signals';
		if (cursor) {
			sql += ' WHERE ts < $2';
			params.push(cursor);
		}
		sql += ' ORDER BY ts DESC LIMIT $1';

		const manager = getManager();
		const rows = await manager.query(sql, params);

		// Compute next cursor for pagination (timestamp of the last row)
		const nextCursor = rows.length > 0 ? rows[rows.length - 1].ts : null;

		res.json({ data: rows, nextCursor });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('GET /api/signals error', err);
		res.status(500).json({ error: 'internal_error' });
	}
});

export default router;
