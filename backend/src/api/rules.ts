import { Router, Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { emitEvent } from '../utils/broadcast';
import { getManager } from 'typeorm';

const router = Router();

// GET /api/rules/config
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const repo: any = getRepository('rule_configs');
    const rows = await repo.find({ order: { name: 'ASC' } });
    res.json({ data: rows });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /api/rules/config error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// PUT /api/rules/config/:name
// Body: { enabled: boolean, config?: object }
export async function upsertRuleConfigHandler(req: Request, res: Response) {
  try {
    const name = req.params.name;
    const { enabled, config } = req.body;
    const manager = getManager();

    // Atomic upsert using Postgres ON CONFLICT to avoid races
    // Returns the inserted/updated row via RETURNING *
    const sql = `INSERT INTO rule_configs (name, enabled, config)
      VALUES ($1, $2, $3)
      ON CONFLICT (name) DO UPDATE SET enabled = EXCLUDED.enabled, config = EXCLUDED.config
      RETURNING *`;
    const updated = await manager.query(sql, [name, enabled, JSON.stringify(config || {})]);

    // Emit update using broadcast helper (no direct require of app index)
    try {
      emitEvent('rule_config_updated', updated[0]);
    } catch (err) {
      // ignore emit errors
    }

    res.json({ data: updated[0] });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('PUT /api/rules/config/:name error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}

router.put('/config/:name', upsertRuleConfigHandler);

export default router;
