-- Add survey_complete and ad_view to credit_ledger reason constraint
-- This allows crediting users for survey completions and ad viewing

-- Drop the existing constraint
ALTER TABLE public.credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_reason_check;

-- Add the updated constraint with new reason types
ALTER TABLE public.credit_ledger 
  ADD CONSTRAINT credit_ledger_reason_check 
  CHECK (reason IN ('mint', 'allocate', 'spend', 'adjust', 'ad_view', 'survey_complete'));
