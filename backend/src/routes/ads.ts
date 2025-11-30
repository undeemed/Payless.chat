import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { processHeartbeat, getAdStats, getCreditBalance, getCreditsPerMinute } from '../db/supabase.js';
import type { HeartbeatResponse, AdStats } from '../types/index.js';

const router = Router();

// Rate limiting map (in-memory, per-instance)
const lastHeartbeatTime = new Map<string, number>();
const MIN_HEARTBEAT_INTERVAL_MS = 25000; // 25 seconds minimum between heartbeats

/**
 * POST /ads/heartbeat
 * Called periodically while ads are visible to earn credits
 */
router.post('/heartbeat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = Date.now();

    // Rate limiting check
    const lastTime = lastHeartbeatTime.get(userId);
    if (lastTime && (now - lastTime) < MIN_HEARTBEAT_INTERVAL_MS) {
      const waitTime = Math.ceil((MIN_HEARTBEAT_INTERVAL_MS - (now - lastTime)) / 1000);
      res.status(429).json({
        error: `Rate limited. Please wait ${waitTime} seconds.`,
        code: 'RATE_LIMITED',
        retry_after: waitTime,
      });
      return;
    }

    // Update last heartbeat time
    lastHeartbeatTime.set(userId, now);

    // Process the heartbeat
    const result = await processHeartbeat(userId);

    const response: HeartbeatResponse = {
      credits_earned: result.creditsEarned,
      total_credits: result.totalCredits,
      session_seconds: result.sessionSeconds,
      credits_per_minute: getCreditsPerMinute(),
    };

    res.json(response);
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Failed to process heartbeat', code: 'HEARTBEAT_ERROR' });
  }
});

/**
 * GET /ads/stats
 * Get user's ad viewing statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await getAdStats(userId);
    const balance = await getCreditBalance(userId);

    res.json({
      ...stats,
      current_balance: balance,
      credits_per_minute: getCreditsPerMinute(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', code: 'STATS_ERROR' });
  }
});

/**
 * GET /ads/config
 * Get ad configuration (credits per minute, etc.)
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    credits_per_minute: getCreditsPerMinute(),
    heartbeat_interval_seconds: 30,
    session_timeout_seconds: 60,
  });
});

export default router;

