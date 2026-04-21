<div align="center">
  <img width="1200" height="475" alt="FlowMint Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>FlowMint</h1>
  <p><strong>The Future of "Cyber-Finance" — Intelligent Wealth Management for India.</strong></p>

    <img src="https://img.shields.io/badge/Version-2.2.0-cyan?style=for-the-badge" alt="Version 2.2.0" />
    <img src="https://img.shields.io/badge/Stack-React_19_%2B_Express-purple?style=for-the-badge" alt="Stack" />
    <img src="https://img.shields.io/badge/AI-Groq_%7C_Llama_3.3-green?style=for-the-badge" alt="AI" />
    <img src="https://img.shields.io/badge/Platform-Web_%2F_Android-blue?style=for-the-badge" alt="Platform" />

  </p>
</div>

---

## What is FlowMint?

FlowMint is a premium, **"Cyber-Finance"** dashboard and financial super-app designed for the next generation of Indian investors. It combines high-fidelity glassmorphic UI with ultra-fast AI insights to turn complex financial data into actionable wealth-building blocks.

### Key Features

- **Real Data Dashboard**: 11+ widgets powered by live Supabase queries — transactions, bills, goals, and spending charts.
- **P2P Smart Lending Ecosystem**: A fully interactive marketplace for peer-to-peer lending with Swipe-to-Fund mechanics.
- **Guardian Restricted Mode**: Intelligent age-gating that strictly limits minors (< 18) to 25% of guardian-approved limits.
- **Gamified Reputation Engine**: Borrowers boost their dynamic Reputation Score (out of 900) by actively repaying EMIs.
- **AI Savings Blueprint**: Generate step-by-step plans to buy your next "Wish" (iPhone, Car, Trip) using Llama 3.3.
- **Core Data CRUD**: Full create/read/update/delete for transactions, expenses, bills, goals, loans, and payments — all persisted in Supabase.
- **Resilient AI Chain**: Primary power from **Groq (Llama 3.3)** with a seamless fallback to **Gemini 2.0 Flash**.
- **Financial Identity & Biometrics**: Integrated Aadhaar/PAN validation and native Biometric Auth (Face ID/Fingerprint).
- **Professional UX**: Glassmorphic Toast notifications, shimmer skeleton loaders, and animated empty states.
- **FlowPay**: Intelligent bill reminders and smart payment tracking.

---

## 🛠️ Technology Stack

| Frontend                  | Backend                 | Intelligence              |
| :------------------------ | :---------------------- | :------------------------ |
| **React 19** + Vite       | **Node.js** + Express   | **Groq** (Llama 3.3 70B)  |
| **Tailwind CSS**          | **Supabase** (Postgres) | **Gemini 2.0 Flash**      |
| **Framer Motion**         | **Helmet** + Rate Limit | **Nominatim** (Geocoding) |
| **Capacitor 8** (Android) | **JWT** + HTTPOnly      | **Native Biometrics**     |

---

## Getting Started

### 1. Requirements

- Node.js (v20+)
- Google Cloud Project (for Auth)
- Groq & Gemini API Keys

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

Create a `.env.local` (root) and `server/.env` (server folder):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_key
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=your_secret (Must match Supabase JWT Secret)
```

### 4. Run the Engine

```bash
npm run dev
```

Access the dashboard at `http://localhost:5173`.

### 5. Android APK

The `flowmint.apk` Android application file is available directly in the root directory for easy installation.

---

## Security & Reliability

- **Hardened Backend**: Deployed on Render with **Helmet.js**, strict **Content Security Policy (CSP)**, **Express Rate Limiting**, and **JWT Signature Verification**.
- **No CDN Vulnerabilities**: Tailwind and all assets are strictly bundled locally via Vite—zero external CDN risk.
- **The 15s Rule**: AI requests automatically failover to backups if the primary engine takes more than 15 seconds.
- **Input Validation**: Server-side validation for required fields, positive numbers, and type constraints on all CRUD endpoints.
- **Row Level Security (RLS)**: Your financial data is strictly yours, enforced at the database level.

---

## Documentation Deep-Dive

- [Detailed Documentation](./DOCUMENTATION.md) — Technical specs & internal architecture.
- [API Integration Map](./API_INTEGRATION_MAP.md) — Current state of all 83+ API points.
- [Knowledge Base](./KNOWLEDGEBASE.md) — UI Tokens, Design System, and Troubleshooting.
- [Product Requirements (PRD)](./PRD.md) — The vision & roadmap.
- [LLM Strategy](./CUSTOM_LLM_STRATEGY.md) — How our Llama/Gemini hybrid works.

---

<p align="center">Made with for the Indian Financial Revolution.</p>
