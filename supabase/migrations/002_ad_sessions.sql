-- Ad Sessions - Track ad exposure time for credit earning
-- Users earn credits based on time spent with ads visible

-- Ad Sessions table
CREATE TABLE IF NOT EXISTS public.ad_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_seconds INTEGER NOT NULL DEFAULT 0,
  credits_earned NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ad_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can read own ad sessions" ON public.ad_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ad_sessions_user_active 
  ON public.ad_sessions(user_id, is_active) 
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ad_sessions_last_heartbeat 
  ON public.ad_sessions(last_heartbeat);

-- Update credit_ledger reason check to include 'ad_view'
ALTER TABLE public.credit_ledger 
  DROP CONSTRAINT IF EXISTS credit_ledger_reason_check;
ALTER TABLE public.credit_ledger 
  ADD CONSTRAINT credit_ledger_reason_check 
  CHECK (reason IN ('mint', 'allocate', 'spend', 'adjust', 'ad_view'));

-- Function to get user's ad stats
CREATE OR REPLACE FUNCTION public.get_ad_stats(p_user_id UUID)
RETURNS TABLE (
  total_seconds_all_time BIGINT,
  total_credits_earned NUMERIC,
  total_seconds_today BIGINT,
  credits_earned_today NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COALESCE(SUM(total_seconds), 0)::BIGINT as total_seconds_all_time,
    COALESCE(SUM(credits_earned), 0) as total_credits_earned,
    COALESCE(SUM(CASE WHEN DATE(started_at) = CURRENT_DATE THEN total_seconds ELSE 0 END), 0)::BIGINT as total_seconds_today,
    COALESCE(SUM(CASE WHEN DATE(started_at) = CURRENT_DATE THEN credits_earned ELSE 0 END), 0) as credits_earned_today
  FROM public.ad_sessions
  WHERE user_id = p_user_id;
$$;

