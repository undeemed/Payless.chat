import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { addCreditEntry, getCreditBalance } from '../db/supabase.js';

const router = Router();

// CPX Research configuration
const CPX_APP_ID = process.env.CPX_APP_ID || '';
const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH || '';
const CPX_CREDITS_PER_DOLLAR = parseInt(process.env.CPX_CREDITS_PER_DOLLAR || '100', 10);
const CPX_API_BASE = 'https://live-api.cpx-research.com/api';

interface CPXSurvey {
  id: string;
  loi: string; // Length of Interview in minutes
  payout: number; // Payout in local currency
  payout_publisher_usd: string;
  conversion_rate: string;
  href: string;
  type: string;
  top: number;
  details: number;
  statistics_rating_count: string;
  statistics_rating_avg: string;
  score: string;
}

interface CPXSurveyResponse {
  status: string;
  count_available_surveys: number;
  count_returned_surveys: number;
  surveys: CPXSurvey[];
}

/**
 * Generate secure hash for CPX Research API
 */
function generateSecureHash(extUserId: string): string {
  return crypto
    .createHash('md5')
    .update(`${extUserId}-${CPX_SECURE_HASH}`)
    .digest('hex');
}

/**
 * GET /cpx/surveys
 * Fetch available surveys for the authenticated user
 */
router.get('/surveys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    if (!CPX_APP_ID || !CPX_SECURE_HASH) {
      res.status(503).json({
        error: 'CPX Research is not configured',
        code: 'CPX_NOT_CONFIGURED',
      });
      return;
    }

    // Generate secure hash
    const secureHash = generateSecureHash(userId);
    
    // Get user's IP and user agent
    const ipUser = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = encodeURIComponent(req.headers['user-agent'] || '');
    
    // Build CPX API URL
    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: userId,
      output_method: 'api',
      ip_user: Array.isArray(ipUser) ? ipUser[0] : ipUser,
      user_agent: userAgent,
      limit: '12',
      secure_hash: secureHash,
    });

    const cpxUrl = `${CPX_API_BASE}/get-surveys.php?${params.toString()}`;
    
    // Fetch surveys from CPX Research
    const response = await fetch(cpxUrl);
    const data = await response.json() as CPXSurveyResponse;

    if (data.status !== 'success') {
      res.status(502).json({
        error: 'Failed to fetch surveys from CPX Research',
        code: 'CPX_API_ERROR',
      });
      return;
    }

    // Transform surveys for frontend
    const surveys = data.surveys.map((survey) => ({
      id: survey.id,
      lengthMinutes: parseInt(survey.loi, 10),
      payoutUsd: parseFloat(survey.payout_publisher_usd),
      creditsReward: Math.floor(parseFloat(survey.payout_publisher_usd) * CPX_CREDITS_PER_DOLLAR),
      conversionRate: parseFloat(survey.conversion_rate),
      href: survey.href,
      type: survey.type,
      rating: parseFloat(survey.statistics_rating_avg) || null,
      ratingCount: parseInt(survey.statistics_rating_count, 10) || 0,
    }));

    res.json({
      surveys,
      count: data.count_returned_surveys,
      total_available: data.count_available_surveys,
      credits_per_dollar: CPX_CREDITS_PER_DOLLAR,
    });
  } catch (error) {
    console.error('CPX surveys error:', error);
    res.status(500).json({
      error: 'Failed to fetch surveys',
      code: 'CPX_FETCH_ERROR',
    });
  }
});

/**
 * GET /cpx/postback
 * Callback endpoint for CPX Research when a user completes a survey
 * This is called by CPX servers, not by users directly
 * 
 * CPX URL format:
 * https://your-domain.com/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}
 */
router.get('/postback', async (req: Request, res: Response) => {
  try {
    const {
      status,            // 1 = completed, 2 = reversed
      trans_id,          // Transaction ID from CPX
      user_id,           // ext_user_id we sent
      sub_id,            // Optional subid 1
      sub_id_2,          // Optional subid 2
      amount_local,      // Payout in local currency
      amount_usd,        // Payout amount in USD
      offer_id,          // Survey/offer ID
      hash,              // Security hash (called secure_hash in CPX)
      ip_click,          // User's IP address
    } = req.query;

    console.log('CPX postback received:', { status, trans_id, user_id, amount_usd, offer_id });

    // Validate required parameters
    if (!user_id || !trans_id || !status || !amount_usd || !hash) {
      console.warn('CPX postback missing params:', { user_id, trans_id, status, amount_usd, hash });
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Verify the request is from CPX (hash validation)
    // CPX sends: MD5(trans_id + "-" + secure_hash)
    const expectedHash = crypto
      .createHash('md5')
      .update(`${trans_id}-${CPX_SECURE_HASH}`)
      .digest('hex');

    if (hash !== expectedHash) {
      console.warn('CPX postback hash mismatch:', { 
        user_id, 
        trans_id, 
        received_hash: hash,
        expected_hash: expectedHash 
      });
      res.status(403).json({ error: 'Invalid hash' });
      return;
    }

    const statusCode = parseInt(status as string, 10);
    const payoutUsd = parseFloat(amount_usd as string);
    const userId = user_id as string;
    const transactionId = trans_id as string;
    const offerId = offer_id as string || 'unknown';

    if (statusCode === 1) {
      // Survey completed - credit the user
      const creditsEarned = Math.floor(payoutUsd * CPX_CREDITS_PER_DOLLAR);
      
      await addCreditEntry(
        userId,
        creditsEarned,
        'survey_complete',
        `CPX Survey ${offerId} (Trans: ${transactionId}, $${payoutUsd})`
      );

      console.log(`CPX postback SUCCESS: User ${userId} earned ${creditsEarned} credits for survey ${offerId}`);
      
      res.json({ status: 'ok', credits_awarded: creditsEarned });
    } else if (statusCode === 2) {
      // Survey reversed - deduct credits (if applicable)
      const creditsToDeduct = Math.floor(payoutUsd * CPX_CREDITS_PER_DOLLAR);
      
      await addCreditEntry(
        userId,
        -creditsToDeduct,
        'adjust',
        `CPX Survey reversed (Trans: ${transactionId})`
      );

      console.log(`CPX postback REVERSED: User ${userId} had ${creditsToDeduct} credits reversed`);
      
      res.json({ status: 'ok', credits_reversed: creditsToDeduct });
    } else {
      res.status(400).json({ error: 'Unknown status code' });
    }
  } catch (error) {
    console.error('CPX postback error:', error);
    res.status(500).json({ error: 'Failed to process postback' });
  }
});

/**
 * GET /cpx/config
 * Get CPX configuration for the frontend
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    configured: !!(CPX_APP_ID && CPX_SECURE_HASH),
    credits_per_dollar: CPX_CREDITS_PER_DOLLAR,
  });
});

export default router;
