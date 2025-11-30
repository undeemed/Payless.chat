import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserById, createUser, getCreditBalance } from '../db/supabase.js';
import type { MeResponse } from '../types/index.js';

const router = Router();

// GET /me - Get current user profile and credit balance
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    // Try to get existing user
    let user = await getUserById(userId);

    // Auto-create user if they don't exist (first login)
    if (!user) {
      user = await createUser(userId, email);
    }

    // Get credit balance
    const creditBalance = await getCreditBalance(userId);

    const response: MeResponse = {
      user_id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      credit_balance: creditBalance,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

