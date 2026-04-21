-- ============================================================
-- FlowMint Core — P2P Lending & Minor Segmentation
-- Purpose: Adds user segmentation columns & P2P core tables
-- ============================================================

-- 1. Adaptive Schema for `profiles` Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='dob') THEN
        ALTER TABLE public.profiles ADD COLUMN dob DATE;
        ALTER TABLE public.profiles ADD COLUMN is_minor BOOLEAN DEFAULT false;
        ALTER TABLE public.profiles ADD COLUMN guardian_id UUID REFERENCES public.profiles(id);
        ALTER TABLE public.profiles ADD COLUMN guardian_approved BOOLEAN DEFAULT false;
        ALTER TABLE public.profiles ADD COLUMN guardian_credit_limit NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. Adaptive Schema for `app_users` Table (Mirror of profiles)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='app_users' AND column_name='dob') THEN
        ALTER TABLE public.app_users ADD COLUMN dob DATE;
        ALTER TABLE public.app_users ADD COLUMN is_minor BOOLEAN DEFAULT false;
        ALTER TABLE public.app_users ADD COLUMN guardian_id UUID REFERENCES public.app_users(id);
        ALTER TABLE public.app_users ADD COLUMN guardian_approved BOOLEAN DEFAULT false;
        ALTER TABLE public.app_users ADD COLUMN guardian_credit_limit NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Create core P2P Tables
CREATE TABLE IF NOT EXISTS public.p2p_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL, -- e.g., 10.5 for 10.5%
    duration_months INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'funding', 'active', 'defaulted', 'completed')),
    amount_funded NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.p2p_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES public.p2p_loans(id) ON DELETE CASCADE,
    lender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_invested NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'committed' CHECK (status IN ('committed', 'active', 'repaid', 'defaulted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('NDA', 'Consent', 'Lending Contract')),
    reference_id UUID, -- For loan contract (loan_id) or consent (minor_id)
    signed_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    device_fingerprint TEXT
);

-- 4. Enable RLS
ALTER TABLE public.p2p_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- p2p_loans queries
DROP POLICY IF EXISTS "Anyone can view loans" ON public.p2p_loans;
CREATE POLICY "Anyone can view loans" ON public.p2p_loans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Borrowers can create loans" ON public.p2p_loans;
CREATE POLICY "Borrowers can create loans" ON public.p2p_loans FOR INSERT WITH CHECK (auth.uid() = borrower_id);

DROP POLICY IF EXISTS "Borrowers can update own loans" ON public.p2p_loans;
CREATE POLICY "Borrowers can update own loans" ON public.p2p_loans FOR UPDATE USING (auth.uid() = borrower_id);

-- p2p_investments queries
DROP POLICY IF EXISTS "Lenders can view their investments" ON public.p2p_investments;
CREATE POLICY "Lenders can view their investments" ON public.p2p_investments FOR SELECT USING (auth.uid() = lender_id);

DROP POLICY IF EXISTS "Borrowers can view investments on their loans" ON public.p2p_investments;
CREATE POLICY "Borrowers can view investments on their loans" ON public.p2p_investments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.p2p_loans WHERE id = p2p_investments.loan_id AND borrower_id = auth.uid())
);

DROP POLICY IF EXISTS "Lenders can create investments" ON public.p2p_investments;
CREATE POLICY "Lenders can create investments" ON public.p2p_investments FOR INSERT WITH CHECK (auth.uid() = lender_id);

-- agreements queries
DROP POLICY IF EXISTS "Users can view their own agreements" ON public.agreements;
CREATE POLICY "Users can view their own agreements" ON public.agreements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Guardians can view minor agreements" ON public.agreements;
CREATE POLICY "Guardians can view minor agreements" ON public.agreements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = agreements.user_id AND guardian_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create agreements" ON public.agreements;
CREATE POLICY "Users can create agreements" ON public.agreements FOR INSERT WITH CHECK (auth.uid() = user_id);
