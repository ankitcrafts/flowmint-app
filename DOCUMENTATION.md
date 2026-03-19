# FlowMint Documentation

> **Version:** 2.1 • **Last Updated:** 20 March 2026 • **Status:** MVP Phase 1 Complete

---

## 1. Project Overview

**FlowMint** is a modern, cross-platform financial super app built with cutting-edge web technologies. It provides a unified financial command center where users can manage payments, credit health, expense tracking, savings goals, loan discovery, and AI-driven financial advisory — all wrapped in a premium "Cyber-Finance" aesthetic. The app runs as a responsive PWA and is optimized for native mobile (Android/iOS) via Capacitor.

### Key Highlights

- **15 major components** built and functional
- **78 API integration points** identified and mapped (18 integrated, 12 ongoing, 48 pending)
- **AI-powered insights** via Google Gemini (Flash + Pro models)
- **Dual authentication** — Google OAuth + Mobile OTP with JWT sessions
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
| jsonwebtoken        | 9.0.3   | JWT generation and verification              |
| google-auth-library | 10.5.0  | Google ID Token verification (server-side)   |
| cookie-parser       | 1.4.7   | Parse HTTPOnly auth cookies                  |
| cors                | 2.8.6   | Cross-origin request handling                |
| dotenv              | 17.3.1  | Environment variable management              |

# FlowMint — Engineering & Technical Documentation

> **Project:** FlowMint — Financial Super-App with AI Wealth Management  
> **Version:** 2.1  
> **Last Updated:** 20 March 2026 — Biometric Security Enhancements & Android Build Update.

---

## 🏗️ Technology Stack

| Layer           | Technology                                       | Purpose                                                             |
| --------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| **Frontend**    | React 19, Vite, TypeScript                       | High-performance SPA with modern UI/UX.                             |
| **Styling**     | Tailwind CSS, Framer Motion                      | Layouts, custom animations, and "Cyber-Finance" aesthetic.          |
| **Mobile**      | Capacitor 8+                                     | Native Android/iOS wrapper for web assets.                          |
| **Backend**     | Node.js, Express.js (on Render)                  | Secure API proxy, auth mediation, and AI orchestration.             |
| **Database**    | Supabase (Postgres)                              | Row-level secured (RLS) data persistence.                           |
| **Auth**        | Supabase Auth + Google GSI + Native Cred Manager | Cross-platform identity (Google One Tap & Native Sign-In).          |
| **Security**    | Biometric Auth (Face ID/Fingerprint)             | Step-up authentication & cryptographic keys for local identities.   |
| **AI (Core)**   | Groq (Llama 3.3 70B)                             | Primary LLM for ultra-low latency financial insights (Llama-first). |
| **AI (Backup)** | Gemini 2.0 Flash                                 | Fallback LLM and high-context reasoning.                            |

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20+)
- npm (v10+)
- Git
- Google Cloud Project (for Auth)
- Groq API Key (for Primary AI)

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
    GROQ_API_KEY=***
    GEMINI_API_KEY=***
    JWT_SECRET=*** (Must match Supabase JWT Secret)
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev       # Starts Vite (Frontend) and Server (Backend) concurrently
    ```

---

## 🏛️ System Architecture

### 1. Hybrid Cross-Platform (React + Capacitor)

FlowMint uses a single codebase for Web and Android. The frontend detects the platform at runtime to toggle between Browser APIs (Google One Tap) and Native Plugins (Credential Manager).

### 2. Double-Shield Authentication

- **Web**: Google One Tap → Response → Supabase Auth.
- **Mobile**: Native Capacitor Plugin → Android Credential Manager → Token → Supabase Auth.
- **Session Persistence**: JWTs are stored in HTTPOnly cookies (Web) and Secure Storage (Native).
- **Biometric Enclaves**: Local keys generated via Web Crypto map to Face ID/Fingerprint hardware, overriding manual OTPs for step-up actions (Identity Vault).

### 3. AI Resilience Logic (The 15s Rule)

The backend implements a failure-proof AI chain:

1.  **Groq (Llama 3.3 70B)**: Triggered first. Time limit: 15 seconds.
2.  **Gemini 2.0 Flash**: Triggered if Groq fails or times out.
3.  **Local Deterministic Engine**: Triggered if all AIs fail (Pure JSON math).

---

## 🔐 Security Standards

- **JWT Signature Verification**: Every backend request verifies the JWT signature using `JWT_SECRET` to prevent token tampering.
- **Express Rate Limiting**: Global limit of 100 requests per 15 minutes to prevent DDoS and API credit exhaustion.
- **Helmet.js Headers**: Implemented in production to set secure HTTP headers (XSS, Clickjacking, MIME).
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
| **1.2**   | P2P Smart Lending Engine                   | ❌ Pending |

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
│   ├── FlowLend.tsx            # Lending partners marketplace
│   ├── FlowPay.tsx             # UPI payments, QR scan, P2P transfer
│   ├── InitialSetup.tsx        # Multi-step onboarding/KYC wizard
│   ├── LoanMarketplace.tsx     # Loan products with EMI calculator
│   ├── Onboarding.tsx          # Feature showcase slideshow (8 slides)
│   └── SustainabilityCard.tsx  # Eco impact score with chart
│
├── services/                   # Frontend service layer
│   ├── geminiService.ts        # Gemini AI integration (insights + plans)
│   ├── apiService.ts           # Mock data service (transactions, bills, goals, loans)
│   ├── supabase.ts             # Supabase client initialization
│   └── BiometricService.ts     # Interface for the biometric native plugin
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
User Opens App
│
├─ supabase.auth.getSession() → Check existing session
├─ supabase.auth.onAuthStateChange() → Subscribe to changes
│
├─ IF NO SESSION → Auth.tsx
│   ├─ Google Sign-In (Web)
│   │   └─ GSI → ID Token → supabase.auth.signInWithIdToken()
│   │
│   ├─ Google Sign-In (Android)
│   │   └─ Capacitor GoogleAuth Plugin → ID Token → supabase.auth.signInWithIdToken()
│   │
│   ├─ Mobile OTP
│   │   └─ Phone Input → OTP Verify → POST /auth/mobile → JWT Cookie
│   │   └─ Fallback: Direct Supabase query (when Express unavailable)
│   │
│   └─ Apple Sign-In (Mock — not yet implemented)
│
├─ IF SESSION EXISTS → Load App
│   └─ supabase.from('profiles').select() → Hydrate user profile
│   └─ Render Dashboard + Navigation
│
└─ LOGOUT
    └─ POST /auth/logout → Clear cookie
    └─ (Should also call supabase.auth.signOut())
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│ Express API  │────▶│   Supabase   │
│  (React/TS)  │◀────│  (Node.js)   │◀────│ (PostgreSQL) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       ├─ supabase.auth.*  ─────────────────────▶│  (Direct Auth)
       ├─ supabase.from('profiles')  ───────────▶│  (Direct DB)
       │                                         │
       └─ @google/genai ──────▶ Google Gemini API
```

### Vite Proxy Configuration

In development, Vite proxies API requests to the Express backend:

| Route Pattern | Target                  | Purpose                         |
| ------------- | ----------------------- | ------------------------------- |
| `/auth/*`     | `http://localhost:3000` | Authentication endpoints        |
| `/api/*`      | `http://localhost:3000` | Future business logic endpoints |

---

## 6. Database Schema

### Existing Tables

| Table       | Columns                                                              | Used By                     |
| ----------- | -------------------------------------------------------------------- | --------------------------- |
| `app_users` | `id`, `mobile`, `name`, `email`, `google_id`, `avatar`, `created_at` | Auth (Express server)       |
| `profiles`  | `id`, `name`, `avatar_url`                                           | App.tsx (session hydration) |

### Required Tables (Not Yet Created)

| Table                   | Purpose                              | Priority    |
| ----------------------- | ------------------------------------ | ----------- |
| `transactions`          | Financial transactions for dashboard | 🔴 Critical |
| `expenses`              | User expense records                 | 🔴 Critical |
| `bills`                 | Bill reminders with due dates        | 🔴 Critical |
| `goals`                 | Savings goals tracking               | 🟡 Medium   |
| `wishes`                | AI wish tracker items                | 🟡 Medium   |
| `payments`              | FlowPay payment history              | 🟡 Medium   |
| `loan_products`         | Loan marketplace catalog             | 🟢 Low      |
| `user_settings`         | Theme, notification preferences      | 🟢 Low      |
| `chat_history`          | AI chat conversation persistence     | 🟢 Low      |
| `sustainability_scores` | Eco impact tracking                  | 🟢 Low      |

---

## 7. API Reference

### Express Server Endpoints (`server/index.js`)

| Method | Endpoint       | Auth   | Request Body       | Response                                       | Description                                      |
| ------ | -------------- | ------ | ------------------ | ---------------------------------------------- | ------------------------------------------------ |
| `POST` | `/auth/google` | —      | `{ credential }`   | Sets `access_token` cookie, returns `{ user }` | Verify Google ID token → upsert user → issue JWT |
| `POST` | `/auth/mobile` | —      | `{ mobile, name }` | Sets `access_token` cookie, returns `{ user }` | Validate mobile → upsert user → issue JWT        |
| `GET`  | `/auth/me`     | 🔒 JWT | —                  | `{ user }`                                     | Decode JWT cookie → return user profile          |
| `POST` | `/auth/logout` | —      | —                  | `{ message }`                                  | Clear the `access_token` cookie                  |

### External APIs Used

| API                 | Endpoint                                                            | Used In                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------- |
| Google GSI          | `https://accounts.google.com/gsi/client`                            | Auth.tsx                   |
| Nominatim Geocoding | `https://nominatim.openstreetmap.org/reverse?lat=&lon=&format=json` | InitialSetup.tsx           |
| DiceBear Avatars    | `https://api.dicebear.com/7.x/avataaars/svg?seed=`                  | Auth.tsx, InitialSetup.tsx |
| Google Gemini AI    | via `@google/genai` SDK                                             | geminiService.ts           |

> 📄 For the complete 78-API integration registry, see **`API_INTEGRATION_MAP.md`**.

---

## 8. Environment Variables

| Variable                    | Scope    | Required | Description                                   |
| --------------------------- | -------- | -------- | --------------------------------------------- |
| `VITE_API_URL`              | Frontend | Yes      | Base URL for API server                       |
| `GEMINI_API_KEY`            | Both¹    | Yes      | Google Gemini API key                         |
| `VITE_SUPABASE_URL`         | Frontend | Yes      | Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY`    | Frontend | Yes      | Supabase public anon key                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend  | Yes      | Supabase admin key (never expose to frontend) |
| `GOOGLE_CLIENT_ID`          | Both     | Yes      | Google OAuth 2.0 client ID                    |
| `JWT_SECRET`                | Backend  | Yes      | Secret key for signing JWTs                   |

¹ _`GEMINI_API_KEY` is mapped to `process.env.GEMINI_API_KEY` via Vite's `define` config._

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

- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection for cookie-based auth
- [ ] Input sanitization on all user inputs
- [ ] Supabase Row Level Security (RLS) policies on all tables
- [ ] OWASP Top 10 security audit before production launch
