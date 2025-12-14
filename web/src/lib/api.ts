// API client for frontend - uses Next.js API routes directly

export async function getApiToken(): Promise<string | null> {
  // Get Supabase session token
  if (typeof window === 'undefined') return null;
  
  const { createClient } = await import('./supabase');
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getApiToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use Next.js API routes (relative path)
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface BalanceResponse {
  credit_balance: number;
}

export interface AdStatsResponse {
  total_seconds_all_time: number;
  total_credits_earned: number;
  total_seconds_today: number;
  credits_earned_today: number;
  current_balance: number;
  credits_per_minute: number;
}

export const api = {
  async getBalance(): Promise<BalanceResponse> {
    return apiRequest<BalanceResponse>('/credits/balance');
  },

  async getAdStats(): Promise<AdStatsResponse> {
    // Use credits/balance route which returns all needed stats
    return apiRequest<AdStatsResponse>('/credits/balance');
  },

  async getMe() {
    return apiRequest('/credits/balance');
  },
};
