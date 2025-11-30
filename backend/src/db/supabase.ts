import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, CreditLedgerEntry, ProviderUsage, AdSession, AdStats } from '../types/index.js';

// Singleton Supabase client
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    }

    supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabase;
}

// User queries
export async function getUserById(userId: string): Promise<User | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

export async function createUser(userId: string, email: string, displayName?: string, avatarUrl?: string): Promise<User> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Credit queries
export async function getCreditBalance(userId: string): Promise<number> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_credit_balance', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data ?? 0;
}

export async function addCreditEntry(
  userId: string,
  delta: number,
  reason: CreditLedgerEntry['reason'],
  description?: string
): Promise<CreditLedgerEntry> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('credit_ledger')
    .insert({
      user_id: userId,
      delta,
      reason,
      description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function spendCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; newBalance: number }> {
  const client = getSupabaseClient();

  // Check balance first
  const currentBalance = await getCreditBalance(userId);
  if (currentBalance < amount) {
    return { success: false, newBalance: currentBalance };
  }

  // Deduct credits
  await addCreditEntry(userId, -amount, 'spend', description);

  const newBalance = await getCreditBalance(userId);
  return { success: true, newBalance };
}

// Provider usage tracking
export async function recordProviderUsage(
  userId: string,
  provider: ProviderUsage['provider'],
  model: string,
  creditsSpent: number,
  tokensInput?: number,
  tokensOutput?: number
): Promise<ProviderUsage> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('provider_usage')
    .insert({
      user_id: userId,
      provider,
      model,
      credits_spent: creditsSpent,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Ad session tracking
const CREDITS_PER_MINUTE = 10;
const SESSION_TIMEOUT_SECONDS = 60;

export async function getActiveAdSession(userId: string): Promise<AdSession | null> {
  const client = getSupabaseClient();
  const timeoutThreshold = new Date(Date.now() - SESSION_TIMEOUT_SECONDS * 1000).toISOString();
  
  const { data, error } = await client
    .from('ad_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('last_heartbeat', timeoutThreshold)
    .order('last_heartbeat', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

export async function createAdSession(userId: string): Promise<AdSession> {
  const client = getSupabaseClient();
  
  // First, mark any existing active sessions as inactive
  await client
    .from('ad_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  const { data, error } = await client
    .from('ad_sessions')
    .insert({
      user_id: userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdSessionHeartbeat(
  sessionId: string,
  secondsElapsed: number
): Promise<{ creditsEarned: number; session: AdSession }> {
  const client = getSupabaseClient();
  
  // Calculate credits earned for this heartbeat
  const creditsEarned = (secondsElapsed / 60) * CREDITS_PER_MINUTE;

  // Update the session
  const { data: session, error: sessionError } = await client
    .from('ad_sessions')
    .update({
      last_heartbeat: new Date().toISOString(),
      total_seconds: client.rpc('', {}), // Will update with raw SQL
    })
    .eq('id', sessionId)
    .select()
    .single();

  // Use raw update for incrementing
  const { data, error } = await client
    .from('ad_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;

  // Update with incremented values
  const newTotalSeconds = (data.total_seconds || 0) + secondsElapsed;
  const newCreditsEarned = (parseFloat(data.credits_earned) || 0) + creditsEarned;

  const { data: updatedSession, error: updateError } = await client
    .from('ad_sessions')
    .update({
      last_heartbeat: new Date().toISOString(),
      total_seconds: newTotalSeconds,
      credits_earned: newCreditsEarned,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (updateError) throw updateError;

  return { creditsEarned, session: updatedSession };
}

export async function processHeartbeat(userId: string): Promise<{
  creditsEarned: number;
  totalCredits: number;
  sessionSeconds: number;
}> {
  const client = getSupabaseClient();
  
  // Get or create active session
  let session = await getActiveAdSession(userId);
  
  if (!session) {
    session = await createAdSession(userId);
    // First heartbeat of a new session - no time elapsed yet
    const balance = await getCreditBalance(userId);
    return {
      creditsEarned: 0,
      totalCredits: balance,
      sessionSeconds: 0,
    };
  }

  // Calculate time since last heartbeat
  const lastHeartbeat = new Date(session.last_heartbeat);
  const now = new Date();
  const secondsElapsed = Math.min(
    Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000),
    SESSION_TIMEOUT_SECONDS // Cap at timeout to prevent abuse
  );

  // Update session and calculate credits
  const creditsEarned = (secondsElapsed / 60) * CREDITS_PER_MINUTE;
  const newTotalSeconds = session.total_seconds + secondsElapsed;
  const newSessionCredits = parseFloat(String(session.credits_earned)) + creditsEarned;

  // Update session
  const { error: updateError } = await client
    .from('ad_sessions')
    .update({
      last_heartbeat: now.toISOString(),
      total_seconds: newTotalSeconds,
      credits_earned: newSessionCredits,
    })
    .eq('id', session.id);

  if (updateError) throw updateError;

  // Add credits to ledger (only if meaningful amount)
  if (creditsEarned >= 0.01) {
    await addCreditEntry(
      userId,
      Math.floor(creditsEarned * 100) / 100, // Round to 2 decimals
      'ad_view',
      `Ad viewing: ${secondsElapsed}s`
    );
  }

  const totalCredits = await getCreditBalance(userId);

  return {
    creditsEarned: Math.floor(creditsEarned * 100) / 100,
    totalCredits,
    sessionSeconds: newTotalSeconds,
  };
}

export async function getAdStats(userId: string): Promise<AdStats> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('get_ad_stats', {
    p_user_id: userId,
  });

  if (error) throw error;
  
  // Handle array result from RPC
  const stats = Array.isArray(data) ? data[0] : data;
  
  return {
    total_seconds_all_time: stats?.total_seconds_all_time ?? 0,
    total_credits_earned: stats?.total_credits_earned ?? 0,
    total_seconds_today: stats?.total_seconds_today ?? 0,
    credits_earned_today: stats?.credits_earned_today ?? 0,
  };
}

export function getCreditsPerMinute(): number {
  return CREDITS_PER_MINUTE;
}

