import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, CreditLedgerEntry, ProviderUsage } from '../types/index.js';

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

