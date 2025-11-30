import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getCreditBalance } from '../db/supabase.js';
import type { BalanceResponse } from '../types/index.js';

const router = Router();

// GET /credits/balance - Get current credit balance
router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const balance = await getCreditBalance(userId);

    const response: BalanceResponse = {
      credit_balance: balance,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

