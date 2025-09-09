import { Router } from 'express';
import zerodha from './zerodha';

const router = Router();
router.use('/zerodha', zerodha);

export default router;
