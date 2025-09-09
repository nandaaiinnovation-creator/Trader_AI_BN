import { Router } from 'express';
import { Request, Response } from 'express';
import { zerodhaService } from '../../../services/zerodha';
import { logger } from '../../../utils/logger';
import { TypedRequestQuery, ZerodhaCallbackQuery } from '../../../types/express';

const router = Router();

router.get('/login-url', (_req: Request, res: Response) => {
  try {
    const url = zerodhaService.getLoginUrl();
    res.json({ url });
  } catch (err) {
  logger.error({ message: 'Failed to generate login URL', err });
    res.status(500).json({ error: 'Failed to generate login URL' });
  }
});

router.get('/callback', async (req: TypedRequestQuery<ZerodhaCallbackQuery>, res: Response) => {
  const { request_token } = req.query;
  
  if (!request_token) {
    return res.status(400).json({ error: 'No request token provided' });
  }

  try {
    await zerodhaService.handleCallback(request_token);
    res.redirect('/');
  } catch (err) {
  logger.error({ message: 'Zerodha callback failed', err });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json({
    connected: zerodhaService.getWsState() === 'OPEN',
    lastMessageTime: zerodhaService.getLastMessageTime()
  });
});

export default router;
