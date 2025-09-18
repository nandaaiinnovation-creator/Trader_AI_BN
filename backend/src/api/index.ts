import { Router } from 'express';
import signals from './signals';
import candles from './candles';
import backtest from './backtest';
import settings from './settings';
import rules from './rules';
import sentiment from './sentiment';

const router = Router();
router.use('/signals', signals);
router.use('/candles', candles);
router.use('/backtest', backtest);
router.use('/settings', settings);
router.use('/rules', rules);
router.use('/sentiment', sentiment);

export default router;
