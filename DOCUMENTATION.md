# FlowMint Documentation

> **Version:** V1 safety transition • **Last Updated:** 20 March 2026
> **Product:** FlowMint — Your AI Financial Copilot.
> Historical implementation and architecture notes below are retained for reference. Legacy payment, lending, credit, biometric, and authentication modules may appear in those notes but are not part of the active V1 navigation.

---

## 1. Project Overview

**FlowMint** is a cross-platform AI financial copilot for user-entered financial information. V1 supports planning, expense tracking, bills, goals, and AI guidance. It does not provide payments, wallets, lending, bank connections, or real-time bank balances. The app runs as a responsive PWA and is optimized for native mobile (Android/iOS) via Capacitor.

### Key Highlights

- **Server-delivered email OTP authentication** with SMTP delivery, hashed database verification, and Supabase sessions
- **Google OAuth sign-in** through Supabase Auth on web, Android, and iOS; Google sessions persist across app restarts as an alternative to email OTP
- **User-entered financial profile** used for financial planning and dashboard summaries
- **AI requests proxied by the backend**; provider secrets are server-only
- **Supabase-backed expense, bill-reminder, and savings-goal records**
- **No V1 money movement or loan marketplace**; legacy source remains in the repository but is not routed
- **Dark/Light theme** with CSS variable-based theming system
- **PWA-ready** with auto-updating service worker

---

## 2. Technology Stack

### Core Frameworks

| Technology | Version | Purpose                                               |
| ---------- | ------- | ----------------------------------------------------- |
| React      | 19.2.4  | UI framework — functional components with hooks       |
| TypeScript | ~5.8.2  | Type safety across frontend                           |
| Vite       | 6.2.0   | Build tool and dev server                             |
| Node.js    | 18+     | Runtime for both frontend tooling and Express backend |
| Capacitor  | 8.1.0   | Web-to-native bridge for Android/iOS                  |

### UI & Styling

| Technology     | Version | Purpose                                         |
| -------------- | ------- | ----------------------------------------------- |
| Tailwind CSS   | 4.1.18  | Utility-first CSS with CSS-first configuration  |
| Framer Motion  | 12.34.0 | Animations, transitions, and micro-interactions |
| Lucide React   | 0.563.0 | Consistent, modern icon set                     |
| Recharts       | 3.7.0   | Financial charts (Area, Bar, Pie)               |
| clsx           | 2.1.1   | Conditional class name utility                  |
| tailwind-merge | 3.4.0   | Merge Tailwind classes without conflicts        |

### Backend & Data

| Technology          | Version | Purpose                                      |
| ------------------- | ------- | -------------------------------------------- |
| Express.js          | 5.2.1   | API server — authentication & business logic |
| Supabase JS         | 2.95.3  | Database client (PostgreSQL)                 |
| jsonwebtoken        | 9.0.3  | Legacy authentication support                |
| google-auth-library | 10.5.0 | Legacy Google sign-in support                |
| cookie-parser       | 1.4.7   | Parse HTTPOnly auth cookies                  |
| cors                | 2.8.6   | Cross-origin request handling                |
| dotenv              | 17.3.1  | Environment variable management              |

# FlowMint — Engineering & Technical Documentation

> **Project:** FlowMint — Your AI Financial Copilot
> **Version:** 2.2  
> **Last Updated:** 20 March 2026 — Tier 1 Data Integration, Toast/Skeleton Systems, 15 New CRUD Routes.

---

## 🏗️ Technology Stack

| Layer           | Technology                                       | Purpose                                                             |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| **Frontend**    | React 19, Vite, TypeScript                       | High-performance SPA with modern UI/UX.                             |
| **Styling**     | Tailwind CSS, Framer Motion                      | Layouts, custom animations, and "Cyber-Finance" aesthetic.          |
| **Mobile**      | Capacitor 8+                                     | Native Android/iOS wrapper for web assets.                          |
| **Backend**     | Node.js, Express.js (on Render)                  | Secure API proxy, auth mediation, and AI orchestration.             |
| **Database**    | Supabase (Postgres)                              | Row-level secured (RLS) data persistence.                           |
| **Auth**        | Express SMTP + Supabase Postgres/Auth           | Server-sent email OTP, database verification, and Supabase sessions. |
| **Security**    | Biometric Auth (Face ID/Fingerprint)             | Step-up authentication & cryptographic keys for local identities.   |
| **AI (Core)**   | Groq (Llama 3.3 70B)                             | Primary LLM for ultra-low latency financial insights (Llama-first). |
| **AI (Backup)** | Gemini 2.0 Flash                                 | Fallback LLM and high-context reasoning.                            |

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20+)
- npm (v10+)
- Git
- Supabase project with Email OTP and SMTP configured
- Optional backend Groq and/or Gemini API key

### Installation

1.  **Clone the Repo**:

    ```bash
    git clone https://github.com/ankitcrafts/flowmint-app.git
    cd flowmint-app
    ```

2.  **Install Base Dependencies**:

    ```bash
    npm install
    ```

3.  **Install Server Dependencies**:

    ```bash
    cd server && npm install && cd ..
    ```

4.  **Configure Environment**:
    Create `.env.local` in root AND `server/.env` with:

    ```env
    VITE_SUPABASE_URL=***
    VITE_SUPABASE_ANON_KEY=***
    ```

    Configure the SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`) and `SUPABASE_SERVICE_ROLE_KEY` only in the backend environment. Apply `supabase/migrations/006_email_login_otp.sql` in the Supabase SQL Editor. Do not add server secrets to frontend variables.

5.  **Run Development Server**:
    ```bash
    npm run dev       # Starts Vite (Frontend) and Server (Backend) concurrently
    ```

---

## 🏛️ System Architecture

### 1. Hybrid Cross-Platform (React + Capacitor)

FlowMint uses a single codebase for Web and Android. V1 uses an Express SMTP email OTP flow on both web and native builds; Supabase Postgres stores OTP hashes, and Supabase Auth issues the app session after the backend verifies a code.

### 2. Authentication

- The user enters a valid email address and requests a six-digit OTP from the Express backend.
- The backend sends the OTP via configured SMTP and stores only its salted HMAC hash with a ten-minute expiry in Supabase Postgres.
- The backend atomically verifies and consumes the OTP. It then creates or finds the Supabase Auth user and mints a one-time session exchange token.
- The client exchanges the token for a Supabase session; Supabase remains required for app data access and Row Level Security.
- The app uses the session's access token; protected backend routes verify that token with Supabase.
- Never accept a request-body user ID as the authority for user-owned data.
- Google sign-in starts a Supabase OAuth flow in the browser; mobile redirects return through the registered `com.flowmint.app://auth/callback` app URL on both Android and iOS.
- Configure the Google Web OAuth client ID/secret in Supabase Auth's Google provider. They do not belong in frontend `.env` variables.

### 3. AI Requests

The frontend sends AI requests to the authenticated Express backend. The backend loads the user's financial profile and expense records using the verified Supabase user ID, then calls an available provider. Provider keys are server-only. If AI is unavailable, the app reports the error instead of returning fabricated advice.

---

## 🔐 Security Standards

- **Supabase Session Verification**: Protected AI and data API requests verify the Supabase access token. Legacy Express JWT auth endpoints are disabled.
- **Express Rate Limiting**: Global limit of 100 requests per 15 minutes to prevent DDoS and API credit exhaustion.
- **Helmet.js Headers**: Implemented in production to set secure HTTP headers and strict **Content Security Policy (CSP)** whitelists (XSS, Clickjacking, MIME).
- **Local Asset Bundling**: Tailwind CDN completely removed; styles are securely built via PostCSS to reduce XSS surface area.
- **CORS Restricted**: Backend only accepts requests from allowed domains and local development.
- **Row Level Security (RLS)**: Enforced in Supabase. Users can strictly only `SELECT/INSERT/UPDATE` their own records by `auth.uid()`.

---

## 📂 Directory Structure

```text
flowmint/
├── src/                    # Frontend Application
│   ├── components/         # Atomic UI components
│   ├── pages/              # View components (Dashboard, FlowPay, etc.)
│   ├── services/           # API & Database interaction logic
│   ├── utils/              # Calculation engines & helpers
│   ├── plugins/            # Capacitor native code bridges
│   └── App.tsx             # Main router & Auth wrapper
├── server/                 # Express Backend
│   ├── index.js            # API Proxy & Security Middleware
│   ├── package.json        # Lean backend dependencies
│   └── DEPLOY.md           # Production deployment guide
├── supabase/
│   └── migrations/         # SQL schema & RLS policies
├── android/                # Native Android project files
├── capacitor.config.ts     # Platform configuration
└── vite.config.ts          # Build & Proxy configuration
```

---

## 📡 API Reference (Partial)

### AI Insights (`POST /api/ai/spending-insight`)

- **Protected**: Yes (JWT)
- **Engine**: Groq (Llama 3.3)
- **Input**: Transaction categories & totals
- **Output**: Personality analysis + 3 actionable tips.

### Wish Plan (`POST /api/ai/wish-plan`)

- **Protected**: Yes (JWT)
- **Engine**: Groq (Llama 3.3)
- **Input**: `{ wishName, price, currentSavings, timeframe }`
- **Output**: 3-step saving blueprint + speed-up tip.

### Health Check (`GET /`)

- **Protected**: No
- **Returns**: Server status, version, uptime, and AI provider availability (API Key status).

---

## 🚀 Deployment

- **Frontend**: Hosted on Vercel/Netlify or packaged as Android APK.
- **Backend**: Deployed on Render.com (`https://flowmint-app.onrender.com`).
- **Database**: Managed Supabase instance.

> **Note**: For mobile APKs, Ensure `VITE_API_URL` is set to the Render production URL in the build environment.

---

## 📈 Roadmap

| Milestone | Feature                                    | Status     |
| --------- | ------------------------------------------ | ---------- |
| **0.8**   | Multi-Model AI (Groq + Gemini)             | ✅ Done    |
| **0.9**   | Cloud Deployment & Security Hardening      | ✅ Done    |
| **1.0**   | Real Bank Integration (Account Aggregator) | 🔄 Ongoing |
| **1.1**   | Credit Bureau Real-time Pull               | ❌ Pending |
| **1.2**   | P2P Smart Lending Engine                   | ✅ Implemented |

### Running on Mobile (iOS) — _macOS Only_

1. **Build the web assets:**
   ```bash
   npm run build
   ```
2. **Sync with Capacitor:**
   ```bash
   npx cap sync
   ```
3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```
4. Select your target simulator or device and click Run.

---

## 4. Directory Structure

```
flowmint---financial-super-app/
├── components/                 # 15 React UI components
│   ├── AIInsights.tsx          # AI advisor feed + chat interface
│   ├── AIWishTracker.tsx       # Wish/goal tracker with AI tips
│   ├── Auth.tsx                # Full auth flow (Google, Mobile OTP, Apple)
│   ├── BillReminders.tsx       # Bill management with due date tracking
│   ├── Dashboard.tsx           # Main command center — charts, widgets, AI
│   ├── ErrorBoundary.tsx       # React error boundary with retry UI
│   ├── ExpenseTracker.tsx      # Expense logging with category breakdown
│   ├── FlowCredit.tsx          # Credit score gauge, simulator, tips
│   ├── FlowGoals.tsx           # Savings goals with AI plan generation
│   ├── P2PMarketplace.tsx      # Peer-to-peer lending marketplace with reputation scoring
│   ├── FlowPay.tsx             # UPI payments, QR scan, P2P transfer
│   ├── InitialSetup.tsx        # Multi-step onboarding/KYC wizard
│   ├── LoanMarketplace.tsx     # Loan products with EMI calculator
│   ├── Onboarding.tsx          # Feature showcase slideshow (8 slides)
│   └── SustainabilityCard.tsx  # Eco impact score with chart
│
├── services/                   # Frontend service layer
│   ├── geminiService.ts        # Gemini AI integration (insights + plans)
│   ├── apiService.ts           # Real Supabase data service (transactions, bills, goals, expenses, payments)
│   ├── supabase.ts             # Supabase client initialization
│   └── BiometricService.ts     # Interface for the biometric native plugin
│
├── components/                 # Shared UI components
│   ├── Toast.tsx               # Glassmorphic toast notification system (useToast hook)
│   └── Skeleton.tsx            # Shimmer skeleton loaders (7 variants + EmptyState)
│
├── plugins/                    # Custom Capacitor plugins
│   ├── GoogleAuth.ts           # Native Google Sign-In bridge (Credential Manager)
│   ├── BiometricAuth.ts        # Setup for native Biometrics
│   └── BiometricAuthWeb.ts     # Fallback Web-level biometry mappings
│
├── server/                     # Backend Express.js server
│   └── index.js                # Auth routes (/auth/google, /auth/mobile, /auth/me, /auth/logout)
│
├── android/                    # Native Android project (Capacitor-generated)
├── dist/                       # Production build output (gitignored)
├── public/                     # Static assets (PWA icons, favicon)
│
├── App.tsx                     # Root component — routing, auth state, theme
├── types.ts                    # TypeScript interfaces (Transaction, Bill, WishGoal, LoanOffer)
├── index.css                   # Global styles, Tailwind imports, CSS variables, theme system
├── main.tsx                    # React DOM entry point
│
├── vite.config.ts              # Vite config — proxy, PWA, env defines
├── capacitor.config.ts         # Capacitor config (appId: com.flowmint.app)
├── tsconfig.json               # TypeScript configuration
├── postcss.config.js           # PostCSS with Tailwind v4
├── package.json                # Dependencies and scripts
│
├── DOCUMENTATION.md            # This file — technical documentation
├── KNOWLEDGEBASE.md            # Design system, patterns, and conventions
├── PRD.md                      # Product Requirements Document
└── API_INTEGRATION_MAP.md      # Complete API registry (78 endpoints)
```

---

## 5. Architecture Overview

### Authentication Flow

```
User opens app
│
├─ Existing Supabase session? ─ Yes → load that user's profile
│
└─ No session → EmailOtpAuth.tsx
    ├─ Enter email → Express sends a six-digit OTP via SMTP and saves its hash
    ├─ Enter OTP → Express verifies and consumes the database record
    ├─ Exchange one-time token → Supabase Auth creates the app session
    └─ Collect user-entered financial profile if not yet saved
```

> Legacy Google/mobile OTP, fallback authentication, and biometric onboarding source remains in the repository but is not used by V1.

### Data Flow

```
Frontend ── Supabase session ──▶ Supabase Auth
   │                                │
   ├─ RLS-scoped financial records ─┴──▶ Supabase
   │
   └─ Bearer token + AI request ──▶ Express backend
                                      ├─ verifies Supabase session
                                      ├─ loads this user's profile/expenses
                                      └─ calls AI provider with server-only key
```

### Vite Proxy Configuration

In development, Vite proxies API requests to the Express backend:

| Route Pattern | Target                  | Purpose                         |
| ------------- | ----------------------- | ------------------------------- |
| `/auth/*`     | `http://localhost:3000` | Legacy endpoints return `410 Gone` |
| `/api/*`      | `http://localhost:3000` | Authenticated backend API        |

---

## 6. Database Schema

### Existing Tables

| Table       | Columns                                                              | Used By                     |
| ----------- | -------------------------------------------------------------------- | --------------------------- |
| `app_users` | `id`, `mobile`, `name`, `email`, `google_id`, `avatar`, `created_at` | Auth (Express server)       |
| `profiles`  | `id`, `name`, `avatar_url`                                           | App.tsx (session hydration) |

### Core Data Tables (✅ Created)

| Table                   | Purpose                              | Status        |
| ----------------------- | ------------------------------------ | ------------- |
| `transactions`          | User-entered income/expense records; transfer is legacy-only | ✅ Created |
| `expenses`              | Detailed expense tracking            | ✅ Created     |
| `bills`                 | Bill reminders with due dates        | ✅ Created     |
| `goals`                 | Savings goals with AI plans          | ✅ Created     |
| `payments`              | Legacy payment history; no V1 payment flow | ✅ Created |
| `dashboard_summary`     | Aggregated SQL view (SECURITY INVOKER) | ✅ Created  |

### Future Tables

| Table                   | Purpose                              | Priority    |
| ----------------------- | ------------------------------------ | ----------- |
| `loan_products`         | Loan marketplace catalog             | 🟢 Low      |
| `user_settings`         | Theme, notification preferences      | 🟢 Low      |
| `sustainability_scores` | Eco impact tracking                  | 🟢 Low      |

---

## 7. API Reference

### Express Server Endpoints (`server/index.js`)

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| `POST` | `/auth/email-otp/send` | — | Sends six-digit code through backend SMTP and stores its hash in Supabase Postgres. |
| `POST` | `/auth/email-otp/verify` | — | Atomically consumes the OTP, then returns a one-time Supabase session-exchange token. |

### External APIs Used

| API                 | Endpoint                                                            | Used In                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------- |
| Express + SMTP | `/auth/email-otp/send`, `/auth/email-otp/verify` | EmailOtpAuth.tsx |
| Google GSI / native identity modules | Legacy sources retained, not routed in V1 | Auth.tsx, plugins |
| Gemini AI | Backend provider integration; key is server-only | server |

> 📄 For the complete 83-API integration registry, see **`API_INTEGRATION_MAP.md`**.

### Core Data CRUD Endpoints (`server/index.js`)

| Method  | Endpoint              | Auth   | Description                                              |
| ------- | --------------------- | ------ | -------------------------------------------------------- |
| `GET`   | `/api/dashboard`      | 🔒 JWT | Full dashboard summary (5× parallel Supabase queries)     |
| `GET`   | `/api/transactions`   | 🔒 JWT | Paginated transactions with category/type filters         |
| `POST`  | `/api/transactions`   | 🔒 JWT | Create transaction with validation                        |
| `GET`   | `/api/expenses`       | 🔒 JWT | Fetch expenses with category filter                       |
| `POST`  | `/api/expenses`       | 🔒 JWT | Create expense + auto-create linked transaction           |
| `DELETE`| `/api/expenses/:id`   | 🔒 JWT | Delete expense                                            |
| `GET`   | `/api/expenses/summary`| 🔒 JWT | Monthly/category aggregation                             |
| `GET`   | `/api/bills`          | 🔒 JWT | Bills with status filter (paid/unpaid/overdue)            |
| `POST`  | `/api/bills`          | 🔒 JWT | Create bill                                               |
| `PATCH` | `/api/bills/:id/pay`  | 🔒 JWT | Record the user's external bill status; no payment or transaction is created |
| `GET`   | `/api/goals`          | 🔒 JWT | Fetch all goals                                           |
| `POST`  | `/api/goals`          | 🔒 JWT | Create goal with validation                               |
| `PATCH` | `/api/goals/:id`      | 🔒 JWT | Update progress / AI plan / status                        |
| `DELETE`| `/api/goals/:id`      | 🔒 JWT | Delete goal                                               |
| `GET`   | `/api/payments`       | — | Disabled; returns `410 Gone` |
| `POST`  | `/api/payments`       | — | Disabled; returns `410 Gone` |

---

## 8. Environment Variables

| Variable                    | Scope    | Required | Description                                   |
| --------------------------- | -------- | -------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`         | Frontend | Yes      | Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY`    | Frontend | Yes      | Supabase public anon key                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend  | Yes      | Supabase admin key (never expose to frontend) |
| `GROQ_API_KEY`              | Backend  | Optional | Server-side AI provider key                    |
| `GEMINI_API_KEY`            | Backend  | Optional | Server-side AI provider key; never a `VITE_` variable |

---

## 9. Deployment Guide

### Web (Full Stack)

Since the app includes an Express backend server, it requires a persistent Node.js host (not static hosting).

**Recommended Hosts:** Render, Railway, Heroku, or a VPS (AWS EC2, DigitalOcean).

1. Build the frontend: `npm run build`
2. Start Server: `node index.js` (The startup script from package.json executes `node index.js` natively to host both UI and endpoints).

> **Vercel/Netlify:** These are static hosts and won't work with the current Express setup unless you refactor auth routes into serverless functions.

### Android (APK available natively)

The compiled `.apk` can be grabbed directly from the root of the project `flowmint.apk`.
To build manually:

1. Open: `npx cap open android`
2. Update `versionCode` and `versionName` in `android/app/build.gradle`
3. Generate a Signed Bundle: **Build → Generate Signed Bundle/APK**
4. Upload the `.aab` to Google Play Console

### iOS (App Store) — _macOS Only_

1. Open: `npx cap open ios`
2. Update **Version** and **Build** in Xcode General settings
3. Archive: **Product → Archive**
4. Distribute via **App Store Connect**

---

## 10. Security Considerations

| Area                         | Implementation                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| **Session Tokens**           | JWT stored in HTTPOnly, SameSite cookies — not accessible to JavaScript            |
| **Google Auth Verification** | Server-side token verification via `google-auth-library`                           |
| **Supabase Admin Key**       | `SUPABASE_SERVICE_ROLE_KEY` used only in Express backend — never exposed to client |
| **CORS**                     | Restricted to same-origin in production                                            |
| **Error Boundary**           | React ErrorBoundary prevents white-screen crashes; logs errors to console          |
| **Input Validation**         | Aadhaar (Verhoeff algorithm) and PAN (regex) validated client-side                 |

### Security Gaps to Address

- [x] Rate limiting on auth endpoints
- [x] Supabase Row Level Security (RLS) policies on all tables
- [x] Input validation on CRUD endpoints (server-side)
- [ ] CSRF protection for cookie-based auth
- [ ] Input sanitization on all user inputs
- [ ] OWASP Top 10 security audit before production launch
