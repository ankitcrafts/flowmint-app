-- ============================================================
-- FlowMint AI — Database Schema
-- Purpose: Store AI conversations, user financial profiles,
--          and usage tracking for freemium model.
-- Designed for: Future LLM fine-tuning dataset extraction
-- ============================================================

-- ─── 1. AI Conversations ─────────────────────────────────
-- Stores each AI session (e.g., one wish plan generation)
-- Each conversation has a type, context, and can contain
-- multiple messages (for chat-style flows in the future)

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  
  -- Conversation metadata
  type TEXT NOT NULL DEFAULT 'wish_plan',  -- 'wish_plan' | 'spending_insight' | 'chat' | 'financial_advice'
  title TEXT,                               -- Auto-generated: "iPhone 16 Pro Saving Plan"
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'in_progress' | 'failed'
  
  -- The input context (what the user asked)
  input_context JSONB NOT NULL DEFAULT '{}',
  -- Example for wish_plan:
  -- { "wishName": "iPhone 16 Pro", "price": 134900, "currentSavings": 42000,
  --   "monthlyIncome": 60000, "monthlyExpenses": 38000, "existingEMIs": 5000 }
  
  -- The AI response (what the model returned)
  ai_response JSONB NOT NULL DEFAULT '{}',
  -- Example:
  -- { "aiTip": "...", "speedUpTip": "...", "monthsToAfford": 5, "savingSteps": [...] }
  
  -- Model metadata (useful for training data versioning)
  model_used TEXT DEFAULT 'llama-3.3-70b-versatile',
  provider TEXT DEFAULT 'groq',
  response_time_ms INTEGER,               -- Track latency
  tokens_used INTEGER,                     -- Track token consumption
  
  -- User feedback (critical for RLHF fine-tuning later)
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  is_bookmarked BOOLEAN DEFAULT FALSE,     -- User saved this for reference
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user history queries
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_type ON ai_conversations(type);
CREATE INDEX idx_ai_conversations_created ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_conversations_bookmarked ON ai_conversations(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;

-- ─── 2. AI Messages (for chat-style conversations) ──────
-- Supports multi-turn chat in the future

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- For training data extraction
  tokens INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- ─── 3. User Financial Profiles ─────────────────────────
-- Aggregated financial data built over time from user interactions.
-- This is the GOLD for future LLM personalization.

CREATE TABLE IF NOT EXISTS user_financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  
  -- Income & Expenses
  monthly_income NUMERIC(12,2),
  monthly_expenses NUMERIC(12,2),
  monthly_savings NUMERIC(12,2),           -- income - expenses - EMIs
  existing_emis NUMERIC(12,2) DEFAULT 0,
  
  -- Spending patterns (auto-built from transactions)
  top_spending_categories JSONB DEFAULT '[]',
  -- Example: ["Food Delivery", "Shopping", "Subscriptions", "Transport"]
  
  avg_daily_spend NUMERIC(10,2),
  avg_weekly_spend NUMERIC(10,2),
  
  -- Financial health indicators
  credit_score INTEGER,
  savings_rate NUMERIC(5,2),               -- percentage saved monthly
  debt_to_income_ratio NUMERIC(5,2),
  emergency_fund_months NUMERIC(4,1),      -- months of expenses saved
  
  -- Risk & behavior profile (for personalized AI)
  risk_profile TEXT DEFAULT 'moderate',     -- 'conservative' | 'moderate' | 'aggressive'
  spending_personality TEXT,                -- AI-generated: "The Weekend Warrior"
  financial_goals_count INTEGER DEFAULT 0,
  
  -- Investment preferences (learned over time)
  preferred_investments JSONB DEFAULT '[]',
  -- Example: ["SIP", "FD", "PPF", "Gold"]
  
  -- Metadata
  profile_completeness INTEGER DEFAULT 0,  -- 0-100 percentage
  last_ai_interaction TIMESTAMPTZ,
  total_ai_interactions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_profiles_user ON user_financial_profiles(user_id);

-- ─── 4. AI Usage Tracking (Freemium Model) ──────────────
-- Tracks daily/monthly AI usage per user for rate limiting

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  
  -- Usage period
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Counters
  wish_plans_used INTEGER DEFAULT 0,
  spending_insights_used INTEGER DEFAULT 0,
  chat_messages_used INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  
  -- Limits (configurable per user/tier)
  tier TEXT NOT NULL DEFAULT 'free',        -- 'free' | 'pro' | 'premium'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One row per user per day
  UNIQUE(user_id, usage_date)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, usage_date DESC);

-- ─── 5. AI Training Data Queue ──────────────────────────
-- Conversations marked as high-quality for future fine-tuning.
-- Populated when users rate responses positively or bookmark them.

CREATE TABLE IF NOT EXISTS ai_training_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  -- Training data pair
  instruction TEXT NOT NULL,               -- The user's request (cleaned)
  response TEXT NOT NULL,                  -- The AI's response (validated)
  
  -- Quality signals
  user_rating INTEGER,
  quality_score NUMERIC(3,2),              -- 0.00 to 1.00 (computed)
  is_reviewed BOOLEAN DEFAULT FALSE,       -- Manually reviewed by team
  is_approved BOOLEAN DEFAULT FALSE,       -- Approved for training
  
  -- Context tags (for dataset filtering)
  tags JSONB DEFAULT '[]',
  -- Example: ["wish_plan", "electronics", "high_income", "positive_feedback"]
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_queue_approved ON ai_training_queue(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_training_queue_quality ON ai_training_queue(quality_score DESC);

-- ─── 6. Helper function: Auto-update updated_at ─────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_profiles_updated_at
  BEFORE UPDATE ON user_financial_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_updated_at
  BEFORE UPDATE ON ai_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 7. RLS Policies ────────────────────────────────────
-- Users can only access their own data

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_queue ENABLE ROW LEVEL SECURITY;

-- Conversations: users see their own
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid());

-- Messages: users see messages in their conversations
CREATE POLICY "Users can view own messages" ON ai_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );

-- Financial profiles: users see their own
CREATE POLICY "Users can view own profile" ON user_financial_profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON user_financial_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Usage: users see their own
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (user_id = auth.uid());

-- Training queue: only service role can access (backend only)
-- No user-facing policies needed
