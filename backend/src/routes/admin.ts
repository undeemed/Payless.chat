import { Router } from 'express';
import { adminMiddleware } from '../middleware/auth.js';
import { addCreditEntry, getCreditBalance } from '../db/supabase.js';

const router = Router();

// POST /admin/credits/mint - Mint credits to global pool
router.post('/credits/mint', adminMiddleware, async (req, res, next) => {
  try {
    const { user_id, amount, description } = req.body;

    if (!user_id || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        error: 'Invalid request: user_id and positive amount required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    await addCreditEntry(user_id, amount, 'mint', description || 'Admin minted credits');
    const newBalance = await getCreditBalance(user_id);

    res.json({
      success: true,
      user_id,
      amount_minted: amount,
      new_balance: newBalance,
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/credits/allocate - Allocate credits to user
router.post('/credits/allocate', adminMiddleware, async (req, res, next) => {
  try {
    const { user_id, amount, description } = req.body;

    if (!user_id || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        error: 'Invalid request: user_id and positive amount required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    await addCreditEntry(user_id, amount, 'allocate', description || 'Credits allocated');
    const newBalance = await getCreditBalance(user_id);

    res.json({
      success: true,
      user_id,
      amount_allocated: amount,
      new_balance: newBalance,
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/credits/adjust - Adjust credits (can be negative for corrections)
router.post('/credits/adjust', adminMiddleware, async (req, res, next) => {
  try {
    const { user_id, amount, description } = req.body;

    if (!user_id || typeof amount !== 'number') {
      res.status(400).json({
        error: 'Invalid request: user_id and amount required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    await addCreditEntry(user_id, amount, 'adjust', description || 'Credit adjustment');
    const newBalance = await getCreditBalance(user_id);

    res.json({
      success: true,
      user_id,
      amount_adjusted: amount,
      new_balance: newBalance,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

