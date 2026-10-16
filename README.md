<div align="center">
  <img width="1200" height="475" alt="FlowMint Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>FlowMint</h1>
  <p><strong>Your AI Financial Copilot — Understand, Plan, Save, Decide.</strong></p>

    <img src="https://img.shields.io/badge/Version-2.2.0-cyan?style=for-the-badge" alt="Version 2.2.0" />
    <img src="https://img.shields.io/badge/Stack-React_19_%2B_Express-purple?style=for-the-badge" alt="Stack" />
    <img src="https://img.shields.io/badge/AI-Groq_%7C_Llama_3.3-green?style=for-the-badge" alt="AI" />
    <img src="https://img.shields.io/badge/Platform-Web_%2F_Android-blue?style=for-the-badge" alt="Platform" />

  </p>
</div>

---

## What is FlowMint?

FlowMint V1 is a financial planning and expense-tracking app. Users enter their own financial figures and FlowMint helps them understand spending, plan savings goals, track bills, and ask an AI copilot for guidance. It does not connect to bank accounts or move money.

### Key Features

- **Email OTP sign-in**: The backend sends a six-digit code using configured SMTP, stores only a salted hash in Supabase Postgres, and checks it once before establishing a Supabase session. Email sessions are cleared when the app restarts. Google sign-in remains available as an alternative.
- **User-entered financial profile**: Income, expenses, savings, and rent/EMI figures power the dashboard and planning.
- **Expense tracking, bills, and savings goals**: Personal records are scoped to the authenticated user and stored in Supabase.
- **AI financial copilot**: AI requests go through the backend and use the authenticated user's saved financial context.
- **No money movement**: Payment, wallet, transfer, and lending experiences are not available in V1. Bill status can only be recorded as paid outside FlowMint.
- **Backend-only AI secrets**: Provider API keys are configured on the server, never in the Vite frontend.

---

## 🛠️ Technology Stack

| Frontend                  | Backend                 | Intelligence              |
| :------------------------ | :---------------------- | :------------------------ |
| **React 19** + Vite       | **Node.js** + Express   | **Groq** (Llama 3.3 70B)  |
| **Tailwind CSS**          | **Supabase** (Postgres) | **Gemini 2.0 Flash**      |
| **Framer Motion**         | **Helmet** + Rate Limit | **Nominatim** (Geocoding) |
| **Capacitor 8** (Android) | **Supabase Auth**       | **Backend AI proxy**      |

---

## Getting Started

### 1. Requirements

- Node.js (v20+)
- A Supabase project with the FlowMint database migrations applied
- An SMTP provider account with a verified sender address and credentials
- Optional backend AI provider key(s), such as Groq or Gemini

### 2. Installation

```bash
# Clone the repo
git clone https://github.com/ankitcrafts/flowmint-app.git
cd flowmint-app

# Install dependencies
npm install
cd server && npm install && cd ..
```

### 3. Environment Setup

Create a root `.env.local` and configure the backend environment (for local development, `server/.env` or the root `.env.local`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_sender@gmail.com
SMTP_PASSWORD=your_email_provider_app_password
SMTP_FROM="FlowMint <your_sender@gmail.com>"
```

Apply [`supabase/migrations/006_email_login_otp.sql`](./supabase/migrations/006_email_login_otp.sql) in the Supabase SQL Editor before using email sign-in. The migration creates a server-only OTP table and an atomic, single-use verification function. Keep `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_PASSWORD`, and any `OTP_HASH_SECRET` on the backend only; never use a `VITE_` prefix for these secrets. For Gmail, use an App Password and make sure 2-Step Verification is enabled. Other SMTP providers should use their own host, port, TLS mode, and sender details.

The FlowMint server now sends email through SMTP directly, so Supabase Auth's built-in email sender and its email rate limits are not used for OTP delivery. Supabase Postgres and Auth are still used to store OTP hashes and create the authenticated session required by the app's Row Level Security policies. A complete Supabase outage therefore still prevents sign-in and access to app data.

### Email OTP sign-in flow

1. The user enters any valid email address and selects **Send email code**.
2. The backend generates a six-digit code, stores a salted HMAC hash with a 10-minute expiry in Supabase Postgres, and sends the code via SMTP.
3. The user pastes the six-digit code from the email into FlowMint and selects **Verify and continue**.
4. The backend checks and consumes the code atomically; incorrect attempts are counted and the code is single-use. After a valid code, the backend creates or finds the Supabase Auth user and returns a one-time session-exchange token.
5. FlowMint exchanges that token for a Supabase session, then loads the user's profile and continues to financial setup or the dashboard. Incorrect, expired, or exhausted codes show an error; the user can correct the code or request another after the cooldown.

### Google Sign-In (Web, Android, and iOS)

Google Sign-In is an additional sign-in method; email OTP remains available and requires a fresh code each time the email sign-in flow is used. Google sessions can remain signed in across app restarts. V1 uses Supabase OAuth in the system browser on web and native platforms. Create a **Web application** OAuth client in Google Cloud Console, then configure its client ID and secret in **Supabase Dashboard → Authentication → Providers → Google**. Add the Supabase callback URL shown there (usually `https://<project-ref>.supabase.co/auth/v1/callback`) to the Google OAuth client's authorized redirect URIs.

In **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, allow:

- `http://localhost:5173/` for local web development
- `com.flowmint.app://auth/callback` for Android and iOS
- Your deployed web origin and `com.flowmint.app://auth/callback` for release builds

For an external Google OAuth consent screen, publish the app or add test users in Google Cloud Console. The Google OAuth client ID and secret are configured in Supabase—not in frontend `.env` variables. Rebuild/sync native apps after changing native configuration with `npx cap sync` (syncs all installed platforms).

### 4. Run the Engine

```bash
npm run dev
```

Access the dashboard at `http://localhost:5173`.

### 5. Android APK

The `flowmint.apk` Android application file is available directly in the root directory for easy installation.

---

## Security & Reliability

- **Authenticated backend**: AI endpoints verify Supabase access tokens and select financial records using the verified user ID.
- **No CDN Vulnerabilities**: Tailwind and all assets are strictly bundled locally via Vite—zero external CDN risk.
- **The 15s Rule**: AI requests automatically failover to backups if the primary engine takes more than 15 seconds.
- **Input Validation**: Server-side validation for required fields, positive numbers, and type constraints on CRUD endpoints.
- **Row Level Security (RLS)**: Your financial data is strictly yours, enforced at the database level.

---

## Documentation Deep-Dive

- [Detailed Documentation](./DOCUMENTATION.md) — Technical specs & internal architecture.
- [API Integration Map](./API_INTEGRATION_MAP.md) — Current state of all 83+ API points.
- [Knowledge Base](./KNOWLEDGEBASE.md) — UI Tokens, Design System, and Troubleshooting.
- [Product Requirements (PRD)](./PRD.md) — The vision & roadmap.
- [LLM Strategy](./CUSTOM_LLM_STRATEGY.md) — Legacy provider strategy reference; V1 AI requests run through the backend.

---

<p align="center">Made with for the Indian Financial Revolution.</p>
