import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase config');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * GET /api/credits/balance
 * Get credit balance and stats for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabase();

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get credit balance using the RPC function
    const { data: balance, error: balanceError } = await supabase.rpc('get_credit_balance', {
      p_user_id: user.id
    });

    if (balanceError) {
      console.error('Failed to get balance:', balanceError);
    }

    // Get credits earned today (sum of positive deltas from today with reason = survey_complete)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayCredits, error: todayError } = await supabase
      .from('credit_ledger')
      .select('delta')
      .eq('user_id', user.id)
      .eq('reason', 'survey_complete')
      .gte('created_at', today.toISOString());

    if (todayError) {
      console.error('Failed to get today credits:', todayError);
    }

    const creditsEarnedToday = todayCredits?.reduce((sum, entry) => sum + (entry.delta > 0 ? entry.delta : 0), 0) ?? 0;

    // Get all-time credits earned from surveys
    const { data: allTimeCredits, error: allTimeError } = await supabase
      .from('credit_ledger')
      .select('delta')
      .eq('user_id', user.id)
      .eq('reason', 'survey_complete');

    if (allTimeError) {
      console.error('Failed to get all-time credits:', allTimeError);
    }

    const totalCreditsEarned = allTimeCredits?.reduce((sum, entry) => sum + (entry.delta > 0 ? entry.delta : 0), 0) ?? 0;

    return NextResponse.json({
      credit_balance: balance ?? 0,
      current_balance: balance ?? 0,
      credits_per_minute: 0, // Not used for surveys
      total_seconds_all_time: 0, // Not used for surveys
      total_credits_earned: totalCreditsEarned,
      total_seconds_today: 0, // Not used for surveys
      credits_earned_today: creditsEarnedToday,
    });
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
