import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// CPX Research configuration
const CPX_APP_ID = process.env.CPX_APP_ID || process.env.NEXT_PUBLIC_CPX_APP_ID || '';
const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH || '';
const CPX_CREDITS_PER_DOLLAR = parseInt(process.env.CPX_CREDITS_PER_DOLLAR || '100', 10);
const CPX_API_BASE = 'https://live-api.cpx-research.com/api';

interface CPXSurvey {
  id: string;
  loi: string;
  payout: number;
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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase config');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function generateSecureHash(extUserId: string): string {
  return crypto.createHash('md5').update(`${extUserId}-${CPX_SECURE_HASH}`).digest('hex');
}

/**
 * GET /api/cpx/surveys
 * Fetch available surveys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabase();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    if (!CPX_APP_ID || !CPX_SECURE_HASH) {
      return NextResponse.json({
        error: 'CPX Research is not configured',
        code: 'CPX_NOT_CONFIGURED',
      }, { status: 503 });
    }

    // Generate secure hash
    const secureHash = generateSecureHash(userId);
    
    // Get user's IP
    const ipUser = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = encodeURIComponent(request.headers.get('user-agent') || '');
    
    // Build CPX API URL
    const params = new URLSearchParams({
      app_id: CPX_APP_ID,
      ext_user_id: userId,
      output_method: 'api',
      ip_user: ipUser,
      user_agent: userAgent,
      limit: '100',
      secure_hash: secureHash,
    });

    const cpxUrl = `${CPX_API_BASE}/get-surveys.php?${params.toString()}`;
    
    // Fetch surveys from CPX Research
    const response = await fetch(cpxUrl);
    const data = await response.json() as CPXSurveyResponse;

    if (data.status !== 'success') {
      return NextResponse.json({
        error: 'Failed to fetch surveys from CPX Research',
        code: 'CPX_API_ERROR',
      }, { status: 502 });
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

    return NextResponse.json({
      surveys,
      count: data.count_returned_surveys,
      total_available: data.count_available_surveys,
      credits_per_dollar: CPX_CREDITS_PER_DOLLAR,
    });
  } catch (error) {
    console.error('CPX surveys error:', error);
    return NextResponse.json({
      error: 'Failed to fetch surveys',
      code: 'CPX_FETCH_ERROR',
    }, { status: 500 });
  }
}
