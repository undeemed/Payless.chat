-- Payless.ai Initial Schema
-- Creates all required tables for the credit-based LLM service

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Credit Ledger - Append-only ledger for all credit transactions
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL, -- Positive for credits added, negative for spent
  reason TEXT NOT NULL CHECK (reason IN ('mint', 'allocate', 'spend', 'adjust')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can read their own ledger entries
CREATE POLICY "Users can read own ledger" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Index for fast balance queries
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON public.credit_ledger(created_at);

-- Revenue Snapshots - Track ad revenue for credit minting
CREATE TABLE IF NOT EXISTS public.revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period DATE NOT NULL UNIQUE,
  usd_confirmed DECIMAL(10, 2) NOT NULL DEFAULT 0,
  usd_estimated DECIMAL(10, 2) NOT NULL DEFAULT 0,
  credits_minted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (admin only via service key)
ALTER TABLE public.revenue_snapshots ENABLE ROW LEVEL SECURITY;

-- Provider Usage - Track LLM provider usage per user
CREATE TABLE IF NOT EXISTS public.provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'gemini')),
  model TEXT NOT NULL,
  credits_spent INTEGER NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.provider_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own usage" ON public.provider_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Index for usage queries
CREATE INDEX IF NOT EXISTS idx_provider_usage_user_id ON public.provider_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_usage_created_at ON public.provider_usage(created_at);

-- Function to get user's credit balance
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER
  FROM public.credit_ledger
  WHERE user_id = p_user_id;
$$;

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Give new users some initial credits (welcome bonus)
  INSERT INTO public.credit_ledger (user_id, delta, reason, description)
  VALUES (NEW.id, 100, 'allocate', 'Welcome bonus credits');
  
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

