import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

/**
 * GET /api/cpx/hash
 * Generate secure hash for authenticated user to access CPX surveys
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify token and get user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!CPX_SECURE_HASH) {
      return NextResponse.json({ error: 'CPX not configured' }, { status: 503 });
    }

    // Generate MD5 hash: user_id + "-" + secure_hash
    const secureHash = crypto
      .createHash('md5')
      .update(`${user.id}-${CPX_SECURE_HASH}`)
      .digest('hex');

    return NextResponse.json({ 
      secure_hash: secureHash,
      user_id: user.id 
    });
  } catch (error) {
    console.error('CPX hash error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
