// Shared types for Payless.ai backend

export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  delta: number;
  reason:
    | "mint"
    | "allocate"
    | "spend"
    | "adjust"
    | "ad_view"
    | "survey_complete";
  description: string | null;
  created_at: string;
}

export interface AdSession {
  id: string;
  user_id: string;
  started_at: string;
  last_heartbeat: string;
  total_seconds: number;
  credits_earned: number;
  is_active: boolean;
  created_at: string;
}

export interface AdStats {
  total_seconds_all_time: number;
  total_credits_earned: number;
  total_seconds_today: number;
  credits_earned_today: number;
}

export interface HeartbeatResponse {
  credits_earned: number;
  total_credits: number;
  session_seconds: number;
  credits_per_minute: number;
}

export interface RevenueSnapshot {
  id: string;
  period: string;
  usd_confirmed: number;
  usd_estimated: number;
  credits_minted: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderUsage {
  id: string;
  user_id: string;
  provider: "openai" | "anthropic" | "gemini";
  model: string;
  credits_spent: number;
  tokens_input: number | null;
  tokens_output: number | null;
  created_at: string;
}

// API Request/Response types
export interface MeResponse {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  credit_balance: number;
}

export interface BalanceResponse {
  credit_balance: number;
}

export interface EstimateRequest {
  provider: "openai" | "anthropic" | "gemini";
  model: string;
  prompt: string;
  max_tokens?: number;
}

export interface EstimateResponse {
  estimated_credits: number;
  provider: string;
  model: string;
}

export interface ExecuteRequest {
  provider: "openai" | "anthropic" | "gemini";
  model: string;
  prompt: string;
  max_tokens?: number;
  system_prompt?: string;
}

export interface ExecuteResponse {
  response: string;
  credits_spent: number;
  tokens_input: number;
  tokens_output: number;
  provider: string;
  model: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
}

// LLM Provider interface
export interface LLMProvider {
  name: string;
  estimateCost(prompt: string, model: string, maxTokens?: number): number;
  execute(
    prompt: string,
    model: string,
    options?: {
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<LLMResponse>;
}

export interface LLMResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
}

// Authenticated request with user info
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
}
