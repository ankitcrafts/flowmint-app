-- ============================================================
-- FlowMint — Finance Tracking & Risk Engine Schema
-- Purpose: Store credit cards, loans, EMIs, and audit logs.
--          Pre-Account Aggregator (Manual/PDF-based).
-- ============================================================

-- ─── 1. Financial Sources ─────────────────────────────────
-- Tracking where the data came from (PDF Upload or Manual Entry)
CREATE TABLE IF NOT EXISTS financial_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual_upload', 'manual_entry')),
  file_url TEXT, -- Link to Supabase storage bucket
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Credit Accounts ───────────────────────────────────
-- Manually declared or PDF-parsed credit card data
CREATE TABLE IF NOT EXISTS credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  
  issuer_name TEXT NOT NULL,           -- e.g., "HDFC Bank", "ICICI"
  masked_card_number TEXT NOT NULL,    -- e.g., "XXXX-XXXX-XXXX-1234"
  
  credit_limit NUMERIC(12,2) NOT NULL,
  total_outstanding NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  due_date DATE,
  statement_cycle TEXT,                -- e.g., "15th of every month"
  interest_rate NUMERIC(5,2),          -- Annual Percentage Rate (APR)
  
  autopay_enabled BOOLEAN DEFAULT FALSE,
  autopay_inferred BOOLEAN DEFAULT FALSE, -- Inferred from PDF parsing
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Loan Accounts ─────────────────────────────────────
-- Personal loans, Home loans, etc.
CREATE TABLE IF NOT EXISTS loan_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  
  lender_name TEXT NOT NULL,           -- e.g., "SBI", "Bajaj Finserv"
  loan_type TEXT NOT NULL,             -- e.g., "Personal", "Home", "Auto"
  principal_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  
  remaining_balance NUMERIC(12,2) NOT NULL,
  emi_amount NUMERIC(12,2) NOT NULL,
  emi_due_date INTEGER,                -- Day of month (1-31)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. EMI Schedules ─────────────────────────────────────
-- Track payment history for each loan
CREATE TABLE IF NOT EXISTS emi_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loan_accounts(id) ON DELETE CASCADE,
  
  emi_amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Audit Logs ────────────────────────────────────────
-- Log all financial actions for transparency and debugging
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                -- e.g., "UPLOAD_PDF", "TOGGLE_AUTOPAY"
  metadata JSONB DEFAULT '{}',         -- e.g., { "card_id": "...", "prev_status": false }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. Performance Indexes ───────────────────────────────
CREATE INDEX idx_credit_accounts_user ON credit_accounts(user_id);
CREATE INDEX idx_loan_accounts_user ON loan_accounts(user_id);
CREATE INDEX idx_emi_schedules_loan ON emi_schedules(loan_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ─── 7. Row Level Security (RLS) ──────────────────────────
ALTER TABLE financial_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Polices for Credit Accounts
CREATE POLICY "Users can manage their own credit accounts" ON credit_accounts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policies for Loan Accounts
CREATE POLICY "Users can manage their own loan accounts" ON loan_accounts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policies for EMI Schedules (Linked to Loans)
CREATE POLICY "Users can manage their own EMI schedules" ON emi_schedules
  FOR ALL USING (
    loan_id IN (SELECT id FROM loan_accounts WHERE user_id = auth.uid())
  );

-- Policies for Financial Sources
CREATE POLICY "Users can manage their own sources" ON financial_sources
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policies for Audit Logs (Read-only for users)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());
