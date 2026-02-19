# FlowMint AI — Custom LLM Strategy

> **Version:** 2.0 | **Updated:** Feb 2026  
> **Stack:** Llama 3.3 70B → Groq API → Express → React  
> **Vision:** Build FlowMint's own AI that understands Indian finance better than anyone.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Implementation (Phase 1)](#current-implementation)
3. [Freemium Model](#freemium-model)
4. [Data Collection Strategy](#data-collection-strategy)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Integration](#frontend-integration)
8. [Future Roadmap](#future-roadmap)
9. [Environment Variables](#environment-variables)

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FlowMint Architecture                     │
│                                                               │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐ │
│  │  React   │───→│  Express  │───→│  Groq   │───→│ Llama 3.3│ │
│  │ Frontend │    │  Backend  │    │  API    │    │   70B    │ │
│  │ (Mobile  │←───│  :3000   │←───│ Primary │←───│          │ │
│  │  & Web)  │    └────┬─────┘    └─────────┘    └──────────┘ │
│  └─────────┘          │                                      │
│                       │ Fallback                             │
│                       ↓                                      │
│                 ┌──────────┐    ┌──────────┐                 │
│                 │  Gemini  │───→│ Flash 2.0│                 │
│                 │   API    │    │          │                 │
│                 └──────────┘    └──────────┘                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Principles

1.  **Robust Fallback Chain** — Primary: Llama 3.3 (Groq) → Secondary: Gemini Flash 2.0 (Google) → Tertiary: Local Math.
2.  **Mobile-First AI** — API endpoints support both Cookie (Web) and Bearer Token (Mobile/Capacitor) authentication.
3.  **Provider Transparent** — UI badges clarify which model generated the response.
4.  **Graceful Degradation** — If all AIs fail, the app falls back to pure math without the user noticing a crash.

---

## ⚡ Current Implementation

### Phase 1.5: Multi-Model Resiliency (NOW)

| Component    | Implementation                                           |
| ------------ | -------------------------------------------------------- |
| **Primary**  | Llama 3.3 70B Versatile (via Groq)                       |
| **Fallback** | Gemini 2.0 Flash (via Google AI)                         |
| **Safety**   | Local Math Engine (Deterministic fallback)               |
| **Backend**  | Express.js routes (`/api/ai/*`) proxying requests        |
| **Auth**     | Dual-Strategy: JWT Cookies (Web) + Supabase Bearer (App) |
| **Frontend** | `services/llmService.ts` auto-detects environment        |

### Files Modified/Created

```
server/index.js                           — AI routes + data storage
services/llmService.ts                    — Frontend AI service (TypeScript)
components/AIWishTracker.tsx              — Interactive UI with AI integration
supabase/migrations/001_ai_tables.sql     — Database schema
```

---

## 💰 Pricing Model

### Currently: FREE for All Users

FlowMint AI is **completely free** for all users. No daily limits, no paywalls, no upgrade prompts.

**Why free?**

- **Data-first strategy**: Every interaction builds training data for FlowMint AI LLM
- **User trust**: Free access encourages more interactions → richer financial profiles
- **Growth**: Zero friction = maximum adoption
- **Future value**: The stored conversations + profiles are the real product

### Future Monetization (Code Ready, Just Commented Out)

The freemium infrastructure is **fully built and commented out** in the codebase. When ready to monetize, simply uncomment:

| Feature           | Free   | Pro     | Premium   |
| ----------------- | ------ | ------- | --------- |
| Wish Plans        | 5/day  | 50/day  | Unlimited |
| Spending Insights | 10/day | 100/day | Unlimited |
| Chat Messages     | 20/day | 200/day | Unlimited |
| History Access    | ✅     | ✅      | ✅        |
| Bookmarks         | ✅     | ✅      | ✅        |
| Priority Models   | ❌     | ✅      | ✅        |

**To enable freemium limits:**

1. Uncomment `TIER_LIMITS` in `server/index.js`
2. Uncomment `checkUsageLimit()` and `incrementUsage()` functions
3. Uncomment the usage checks in `/api/ai/wish-plan` and `/api/ai/spending-insight` routes
4. Uncomment `LimitReachedError` class in `services/llmService.ts`
5. Restore `UsageBadge` component in `components/AIWishTracker.tsx`

---

## 📊 Data Collection Strategy

### What We Collect (& Why)

Every AI interaction stores:

| Data                | Purpose                           |
| ------------------- | --------------------------------- |
| `input_context`     | Training data input (instruction) |
| `ai_response`       | Training data output (response)   |
| `model_used`        | Version tracking for A/B testing  |
| `response_time_ms`  | Performance monitoring            |
| `tokens_used`       | Cost tracking                     |
| `user_rating (1-5)` | RLHF quality signal               |
| `user_feedback`     | Direct improvement feedback       |
| `is_bookmarked`     | Implicit quality signal           |

### Financial Profile (Auto-Built)

Every wishlist interaction enriches the user's profile:

```json
{
  "monthly_income": 60000,
  "monthly_expenses": 38000,
  "monthly_savings": 17000,
  "existing_emis": 5000,
  "savings_rate": 28,
  "top_spending_categories": ["Food Delivery", "Shopping", "Subscriptions"],
  "spending_personality": "The Weekend Warrior",
  "credit_score": 750,
  "risk_profile": "moderate",
  "profile_completeness": 80,
  "total_ai_interactions": 15
}
```

This profile:

- Powers **personalized AI responses** (more context → better advice)
- Serves as **training data** for per-user LoRA adapters (future)
- Builds **cohort analysis** (segment users by financial behavior)

### Training Data Pipeline

```
User interaction → Save to ai_conversations
      ↓
User rates ≥ 4 stars → Auto-queue to ai_training_queue
      ↓
Manual review → Mark as approved
      ↓
Export as JSONL → Fine-tune Llama 3.2 3B with QLoRA
      ↓
Deploy as FlowMint AI v1
```

---

## 🗄️ Database Schema

### Tables

| Table                     | Purpose                  | Key Fields                                             |
| ------------------------- | ------------------------ | ------------------------------------------------------ |
| `ai_conversations`        | All AI interactions      | user_id, type, input_context, ai_response, user_rating |
| `ai_messages`             | Multi-turn chat (future) | conversation_id, role, content                         |
| `user_financial_profiles` | Auto-built user profiles | income, expenses, savings_rate, personality            |
| `ai_usage`                | Freemium tracking        | user_id, usage_date, tier, \*\_used counters           |
| `ai_training_queue`       | Curated training data    | instruction, response, quality_score, is_approved      |

### Migration File

Located at: `supabase/migrations/001_ai_tables.sql`

Run with:

```bash
# Via Supabase dashboard: SQL Editor → paste & run
# OR via Supabase CLI:
supabase db push
```

---

## 🔌 API Endpoints

### AI Generation

| Method | Endpoint                   | Auth   | Description                      |
| ------ | -------------------------- | ------ | -------------------------------- |
| `POST` | `/api/ai/wish-plan`        | ✅ JWT | Generate saving plan (Llama 3.3) |
| `POST` | `/api/ai/spending-insight` | ✅ JWT | Analyze spending personality     |

### Usage & Limits

| Method | Endpoint        | Auth   | Description         |
| ------ | --------------- | ------ | ------------------- |
| `GET`  | `/api/ai/usage` | ✅ JWT | Check today's quota |

### Conversation History

| Method  | Endpoint                    | Auth   | Description              |
| ------- | --------------------------- | ------ | ------------------------ |
| `GET`   | `/api/ai/history`           | ✅ JWT | List past conversations  |
| `GET`   | `/api/ai/conversations/:id` | ✅ JWT | Get single conversation  |
| `PATCH` | `/api/ai/conversations/:id` | ✅ JWT | Rate, bookmark, feedback |

### Financial Profile

| Method | Endpoint          | Auth   | Description            |
| ------ | ----------------- | ------ | ---------------------- |
| `GET`  | `/api/ai/profile` | ✅ JWT | Get auto-built profile |

---

## 🎨 Frontend Integration

### AIWishTracker Features

- **AI Plan Generation** — Real Llama 3.3 responses with loading animation
- **Wish Card Expansion** — Tap to reveal AI tip, speed-up tip, action plan
- **Star Rating** — 1-5 stars, high-rated plans auto-queued for LLM training
- **Bookmarks** — Save best plans for reference
- **History Tab** — Browse all past AI-generated plans
- **Usage Badge** — Shows remaining free plans for today
- **Limit Banner** — Graceful messaging when quota reached
- **Restore from History** — Re-load any past plan into active wishes
- **Offline Fallback** — Math-based plan when AI is down

### Frontend Service API (`llmService.ts`)

```typescript
// Generate AI plan
const plan = await llmService.getWishPlan({ wishName, price, currentSavings });

// Check quota
const usage = await llmService.getUsage();

// Browse history
const history = await llmService.getHistory("wish_plan", 20, 0, false);

// Rate a plan (4-5 stars → queued for training)
await llmService.rateConversation(conversationId, 5);

// Bookmark
await llmService.toggleBookmark(conversationId, true);

// Get financial profile
const profile = await llmService.getFinancialProfile();
```

### Error Handling

```typescript
try {
  const plan = await llmService.getWishPlan(request);
} catch (error) {
  if (error instanceof LimitReachedError) {
    // Show upgrade prompt
    showLimitBanner(error.message);
  }
  // Falls back to math-based plan automatically
}
```

---

## 🗺️ Future Roadmap

### Phase 2: Fine-Tuned Model (3-6 months)

1. **Collect 10K+ rated conversations** from real users
2. **Export training data** from `ai_training_queue` (approved, rating ≥ 4)
3. **Fine-tune Llama 3.2 3B** using QLoRA on RunPod/Colab
4. **Deploy as FlowMint AI v1** on Hugging Face Inference Endpoints
5. **A/B test** against Groq/Llama 3.3 for quality comparison

### Phase 3: Self-Hosted (6-12 months)

1. **Deploy vLLM** on cloud GPU (T4 or A10G)
2. **Switch `FLOWMINT_AI_BASE_URL`** to self-hosted endpoint
3. **Zero frontend changes** — same API contract
4. **Add per-user LoRA adapters** for hyper-personalization

### Phase 4: Multi-Modal & Chat (12+ months)

1. **Receipt scanning** — Extract spending from photos
2. **Voice input** — "Hey FlowMint, can I afford a PS6?"
3. **Multi-turn chat** — Full financial advisor conversations
4. **Investment recommendations** — Personalized SIP/FD/PPF advice

---

## 🔐 Environment Variables

Add these to your `.env.local`:

```env
# Groq API (get free key at https://console.groq.com)
GROQ_API_KEY=gsk_your_key_here

# Optional: Override model or base URL
FLOWMINT_AI_MODEL=llama-3.3-70b-versatile
FLOWMINT_AI_BASE_URL=https://api.groq.com/openai/v1

# Existing (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

### Getting a Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (Google/GitHub)
3. Create an API key
4. Add to `.env.local` as `GROQ_API_KEY`

**Free tier limits:** ~30 req/min, ~14K tokens/min, ~600 req/day  
**This is sufficient for:** ~100-120 users using FlowMint AI daily

---

## 📁 File Structure

```
flowmint/
├── server/
│   └── index.js                    ← Express server + AI routes
├── services/
│   └── llmService.ts               ← Frontend AI service
├── components/
│   └── AIWishTracker.tsx            ← Interactive wish tracker
├── supabase/
│   └── migrations/
│       └── 001_ai_tables.sql        ← Database schema
├── CUSTOM_LLM_STRATEGY.md          ← This file
└── .env.local                       ← API keys (not committed)
```
