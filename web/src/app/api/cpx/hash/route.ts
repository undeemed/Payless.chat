import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CPX_SECURE_HASH = process.env.CPX_SECURE_HASH || '';

/**
 * GET /api/cpx/hash
 * Generate secure hash for a user to access CPX surveys
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  if (!CPX_SECURE_HASH) {
    return NextResponse.json({ error: 'CPX not configured' }, { status: 503 });
  }

  // Generate MD5 hash: user_id + "-" + secure_hash
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${CPX_SECURE_HASH}`)
    .digest('hex');

  return NextResponse.json({ hash });
}
