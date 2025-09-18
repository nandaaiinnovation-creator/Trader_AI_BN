import { Router, Request, Response } from 'express';
import { sentimentService } from '../services/sentiment';

const router = Router();

router.get('/score', async (req: Request, res: Response) => {
  if (process.env.SENTIMENT_ENABLED !== 'true') {
    return res.status(404).json({ error: 'sentiment_disabled' });
  }
  const symbol = (req.query.symbol as string) || 'BANKNIFTY';
  const timeframe = (req.query.timeframe as string) || '5m';
  try {
    const score = await sentimentService.getScore(symbol, timeframe);
    res.json({ data: { symbol, timeframe, score } });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
