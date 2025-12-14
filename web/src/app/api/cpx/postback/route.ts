import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// CPX Research configuration
const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH || '';
const CPX_CREDITS_PER_DOLLAR = parseInt(process.env.CPX_CREDITS_PER_DOLLAR || '100', 10);

// Supabase client for serverless
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/cpx/postback
 * Callback endpoint for CPX Research when a user completes a survey
 * 
 * CPX URL format:
 * https://payless.chat/api/cpx/postback?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const trans_id = searchParams.get('trans_id');
    const user_id = searchParams.get('user_id');
    const amount_local = searchParams.get('amount_local'); // Points from CPX (uses Currency Factor)
    const amount_usd = searchParams.get('amount_usd');
    const offer_id = searchParams.get('offer_id');
    const hash = searchParams.get('hash');

    console.log('CPX postback received:', { status, trans_id, user_id, amount_local, amount_usd, offer_id });

    // Validate required parameters
    if (!user_id || !trans_id || !status || !amount_local || !hash) {
      console.warn('CPX postback missing params:', { user_id, trans_id, status, amount_local, hash });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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
      return NextResponse.json({ error: 'Invalid hash' }, { status: 403 });
    }

    const statusCode = parseInt(status, 10);
    // Use amount_local directly - CPX already calculated points using Currency Factor
    const creditsEarned = Math.floor(parseFloat(amount_local));
    const supabase = getSupabase();

    // Check if this transaction has already been processed (deduplication)
    const { data: existingEntry } = await supabase
      .from('credit_ledger')
      .select('id')
      .ilike('description', `%Trans: ${trans_id}%`)
      .limit(1)
      .single();

    if (existingEntry) {
      console.log(`CPX postback DUPLICATE: Transaction ${trans_id} already processed, skipping`);
      return NextResponse.json({ status: 'ok', message: 'Transaction already processed' });
    }

    if (statusCode === 1) {
      // Survey completed - credit the user
      const { error } = await supabase
        .from('credit_ledger')
        .insert({
          user_id: user_id,
          delta: creditsEarned,
          reason: 'survey_complete',
          description: `CPX Survey ${offer_id || 'unknown'} (Trans: ${trans_id}, ${creditsEarned} pts, $${amount_usd || '?'})`,
        });

      if (error) {
        console.error('Failed to add credits:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`CPX postback SUCCESS: User ${user_id} earned ${creditsEarned} credits`);
      return NextResponse.json({ status: 'ok', credits_awarded: creditsEarned });
      
    } else if (statusCode === 2) {
      // Survey reversed - deduct credits (use same amount_local value)
      const { error } = await supabase
        .from('credit_ledger')
        .insert({
          user_id: user_id,
          delta: -creditsEarned,
          reason: 'adjust',
          description: `CPX Survey reversed (Trans: ${trans_id}, -${creditsEarned} pts)`,
        });

      if (error) {
        console.error('Failed to deduct credits:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`CPX postback REVERSED: User ${user_id} lost ${creditsEarned} credits`);
      return NextResponse.json({ status: 'ok', credits_reversed: creditsEarned });
      
    } else {
      return NextResponse.json({ error: 'Unknown status code' }, { status: 400 });
    }
  } catch (error) {
    console.error('CPX postback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
