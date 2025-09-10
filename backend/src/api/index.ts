import { Router } from 'express';
import signals from './signals';
import candles from './candles';
import backtest from './backtest';
import settings from './settings';

const router = Router();
router.use('/signals', signals);
router.use('/candles', candles);
router.use('/backtest', backtest);
router.use('/settings', settings);

export default router;
