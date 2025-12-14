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
 * Get credit balance for authenticated user
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
    const { data: balance, error } = await supabase.rpc('get_credit_balance', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Failed to get balance:', error);
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
    }

    return NextResponse.json({
      credit_balance: balance ?? 0,
      current_balance: balance ?? 0,
      credits_per_minute: 10,
      total_seconds_all_time: 0,
      total_credits_earned: balance ?? 0,
      total_seconds_today: 0,
      credits_earned_today: 0,
    });
  } catch (error) {
    console.error('Balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
