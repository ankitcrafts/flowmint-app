# FlowMint AI — Custom LLM Strategy

> **Version:** 2.3 | **Updated:** 22 April 2026  
> **Stack:** Llama 3.3 70B (Groq) → Gemini 2.0 Flash (Fallback) → Express → React  
> **Vision:** A resilient, multi-model AI system optimized for Indian financial context.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     FlowMint AI Resiliency                    │
│                                                               │
│  ┌─────────┐      ┌──────────┐      ┌─────────┐    ┌──────────┐ │
│  │  React   │────→│  Express  │────→│  Groq   │───→│ Llama 3.3│ │
│  │ Frontend │     │  (Render) │     │  API    │    │   70B    │ │
│  │ (Capacitor)←───│  Backend  │←────│ Primary │←───│          │ │
│  └─────────┘      └────┬─────┘      └─────────┘    └──────────┘ │
│                        │                                      │
│                        │ Fallback (15s Timeout)               │
│                        ↓                                      │
│                  ┌──────────┐      ┌──────────┐               │
│                  │  Gemini  │─────→│ Flash 2.0│               │
│                  │   API    │      │          │               │
│                  └──────────┘      └──────────┘               │
│                        │                                      │
│                        │ Critical Error Fallback              │
│                        ↓                                      │
│                  ┌────────────────────────┐                   │
│                  │  Local Math Engine     │                   │
│                  │ (No Internet Required) │                   │
│                  └────────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

### Key Principles

1.  **Triple-Layer Resiliency** — Primary: Llama 3.3 (Groq) → Secondary: Gemini Flash 2.0 (Google) → Tertiary: Local Math.
2.  **Strict Timeouts** — Every AI call is capped at 15 seconds. If the model hangs, the app automatically fails over to the next layer.
3.  **Sanitized Outputs** — Shared `safeJSONParse` utility prevents frontend crashes due to malformed AI responses.
4.  **Cloud Native** — Deployed on Render.com with auto-scaling and health monitoring.
5.  **Provider Transparent** — UI badges clarify which model generated the response (e.g., "Powered by Groq").

---

## ⚡ Current Implementation

### Phase 2: Production Hardening (NOW)

| Component    | Implementation                                         |
| ------------ | ------------------------------------------------------ |
| **Primary**  | Llama 3.3 70B Versatile (via Groq)                     |
| **Fallback** | Gemini 2.0 Flash (via Google AI Studio)                |
| **Safety**   | 15s Request Timeouts + Local Math Fallback             |
| **Security** | Rate Limiting (100 req/rule) + JWT Signature Verify    |
| **Backend**  | Hosted on Render (`https://flowmint-app.onrender.com`) |
| **Mobile**   | `utils/platform.ts` auto-routes to cloud API           |

---

## 💰 Pricing & Usage

### Current: FREE TIER (Open)

FlowMint AI is currently in **Public Beta**. All AI features are available without quota limits to encourage data collection for future RAG/Fine-tuning.

**Operational Safeguards:**

- **Rate Limit**: 100 requests per IP every 15 minutes (Global API protection).
- **Concurrency**: Node.js cluster handles multiple AI generations across users.
- **Cost Control**: Llama 3.3 (Groq) is used as primary due to its high speed/cost efficiency ratio.

---

## 🗄️ Database Schema (Active)

| Table                     | Purpose                  | Status    |
| ------------------------- | ------------------------ | --------- |
| `ai_conversations`        | All AI interactions      | ✅ Active |
| `ai_messages`             | Multi-turn chat          | ✅ Active |
| `user_financial_profiles` | Auto-built user profiles | ✅ Active |
| `ai_usage`                | Tracking & Quotas        | ✅ Active |
| `transactions`            | Financial transaction log | ✅ Active |
| `expenses`                | Detailed expense records | ✅ Active |
| `bills`                   | Bill reminders & due dates | ✅ Active |
| `goals`                   | Savings goals tracking   | ✅ Active |
| `payments`                | Payment history ledger   | ✅ Active |
| `dashboard_summary`       | Aggregated view (SECURITY INVOKER) | ✅ Active |

Migrations: `001_ai_tables.sql`, `create_core_data_tables` (All with RLS + indexes).

---

## 🔌 API Endpoints

| Method  | Endpoint                   | Auth   | Model Target           |
| ------- | -------------------------- | ------ | ---------------------- |
| `POST`  | `/api/ai/wish-plan`        | ✅ JWT | Llama 3.3 / Gemini 2.0 |
| `POST`  | `/api/ai/spending-insight` | ✅ JWT | Llama 3.3 / Gemini 2.0 |
| `POST`  | `/api/ai/chat`             | ✅ JWT | Llama 3.3 / Gemini 2.0 |
| `GET`   | `/api/ai/history`          | ✅ JWT | PostgreSQL Query       |
| `GET`   | `/api/dashboard`           | ✅ JWT | 5× Parallel Supabase    |
| `GET`   | `/api/transactions`        | ✅ JWT | PostgreSQL Query       |
| `POST`  | `/api/transactions`        | ✅ JWT | PostgreSQL Insert      |
| `GET`   | `/api/expenses`            | ✅ JWT | PostgreSQL Query       |
| `POST`  | `/api/expenses`            | ✅ JWT | PostgreSQL Insert      |
| `GET`   | `/api/bills`               | ✅ JWT | PostgreSQL Query       |
| `PATCH` | `/api/bills/:id/pay`       | ✅ JWT | PostgreSQL Update      |
| `GET`   | `/api/goals`               | ✅ JWT | PostgreSQL Query       |
| `POST`  | `/api/goals`               | ✅ JWT | PostgreSQL Insert      |
| `PATCH` | `/api/goals/:id`           | ✅ JWT | PostgreSQL Update      |
| `GET`   | `/api/payments`            | ✅ JWT | PostgreSQL Query       |
| `POST`  | `/api/payments`            | ✅ JWT | PostgreSQL Insert      |

---

## 🗺️ Roadmap (Updated)

### Phase 3: RAG & Contextualization (Q2 2026)

1. **Financial Document RAG**: Ability to upload bank statements and ask questions.
2. **Context Injection**: Automatically feed small snippets of `transactions` data into prompts.
3. **Sentiment Analysis**: Alert user when emotional spending is detected.
4. **P2P Reputation Scoring**: Analyze behavioral repayment patterns and guardian approval limits to dynamically adjust lending risk profiles.

### Phase 4: Self-Hosted LoRA (Q4 2026)

1. Export approved conversations from `ai_training_queue`.
2. Fine-tune Llama 3.2 1B/3B for device-edge inference (100% private).

---

## 🔐 Configuration

Add these to `.env` (Server) and `.env.local` (Local):

```env
GROQ_API_KEY=gsk_***         # Primary AI
GEMINI_API_KEY=AIza***       # Fallback AI
JWT_SECRET=your_secret       # MUST match Supabase JWT Secret
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
```
