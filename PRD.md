# FlowMint — Product Requirements Document (PRD)

> **Version:** 2.2 • **Last Updated:** 20 March 2026

### 3.3. FlowCredit — Credit Health Intelligence

> **Component:** `FlowCredit.tsx` • **Status:** 🔄 UI Built (Mock Score)

- **Credit Score Gauge:** Custom SVG arc gauge with gradient (300–900 range), showing 782 "Excellent"
- **Score Trajectory:** 6-month history chart (Jul–Dec)
- **Credit Behavior:** 3 indicator cards — Utilization (42%), EMI/Income (36%), Late Payments (0)
- **Credit Education:** Expandable accordion explaining 5 score factors with weighted progress bars
- **What-If Simulator:** Interactive scenario builder — Pay off debt (slider), new card toggle, loyalty streak, close old account — with real-time predicted score
- **Actionable Tips:** AI strategy cards for credit improvement
- **Disclosure:** "Manual / Estimated Score – Bureau integration coming soon"

### 3.4. FlowGoals — Smart Savings with AI

> **Component:** `FlowGoals.tsx` • **Status:** ✅ AI + Supabase CRUD Working

- **Wish Tracker:** Goal cards with progress bars (Tokyo Trip 50%, MacBook Pro 25%)
- **AI Plan Generator:** One-tap Gemini AI analysis that creates a detailed 3-step saving strategy
- **Recommended Plans:** Suggested new goals (Masters Fund, New Ride)
- **Tech:** `getWishTrackerPlan()` → Gemini Pro model with "thinking" mode for deeper analysis

### 3.5. Expense Tracker — Track Every Rupee

> **Component:** `ExpenseTracker.tsx` • **Status:** ✅ Supabase CRUD Integrated

- **Expense List:** 10 items with category icons, recurring detection, and date grouping
- **Add Expense:** Bottom sheet modal with smart category auto-suggestion (regex-based)
- **Anomaly Detection:** Alert banner when daily spending exceeds 1.8× the average
- **Monthly Trend:** Bar chart showing 4-month spending trend
- **Category Breakdown:** Progress bar breakdown by category with percentages
- **Recurring Detection:** Auto-tags monthly subscriptions

### 3.6. Bill Reminders — Never Miss a Payment

> **Component:** `BillReminders.tsx` • **Status:** ✅ Supabase CRUD Integrated

- **Overdue Alert:** Prominent red banner with late fee calculation
- **Summary Cards:** Total due amount + EMI-to-income stress ratio
- **EMI Stress Meter:** Visual gauge with color-coded risk levels (Green/Yellow/Red)
- **Filter Tabs:** All, Upcoming, Overdue, Paid
- **Bill List:** 8 bills with icons, due dates, and "Pay Now" action
- **AI Advisory:** Contextual advice on overdue payments and credit score impact

### 3.7. AI Wish Tracker — Lifestyle Goal Tracking

> **Component:** `AIWishTracker.tsx` • **Status:** ✅ AI Working (Groq/Gemini)

- **Wishlist:** Detailed wish cards with progress rings, funded amounts, savings timeline
- **Add Wish:** Modal for creating new wishes with amount targets
- **Summary:** Total wishlist value and overall saved amount
- **Saving Estimate:** Per-wish timeline based on monthly saving rate

### 3.8. Loan Marketplace — Discover & Compare

> **Component:** `LoanMarketplace.tsx` • **Status:** 🔄 UI Built (Mock Products)

- **Pre-Approved Hero:** ₹5,00,000 at 9.25% with "Check Eligibility" CTA
- **Readiness Dashboard:** Credit score (782), readiness percentage (72%), EMI load (36%)
- **EMI Simulator:** Interactive calculator with amount/tenure sliders, showing monthly EMI, total interest, and new EMI load percentage
- **Loan Products:** 6 products from HDFC, Bajaj Finserv, IDFC First, Muthoot, ICICI, SBI with eligibility scoring
- **Disclosure:** "Simulated Mode — No real applications are processed"

### 3.9. FlowLend — Lending Partner Access

> **Component:** `FlowLend.tsx` • **Status:** 🔄 UI Built (Static Data)

- **Pre-Approved Offer:** ₹5,00,000 at 10.5% with "Get Instant Cash" CTA
- **Partner Cards:** HDFC Bank (Personal, 9.25%), Muthoot Finance (Gold, 8.0%), ICICI Bank (Education, 10.5%)
- **Regulatory Disclosure:** "FlowMint is a technology partner and not a licensed NBFC"

### 3.10. FlowMint AI — The Brain

> **Component:** `AIInsights.tsx` + `geminiService.ts` / `llmService.ts` • **Status:** ✅ Fully Integrated

- **Smart Insights Feed:** 6 categorized insight cards (Goal Acceleration, EMI Stress, Credit Health, Loan Readiness, Spending Psychology, Wish Strategy) generated via Groq backend.
- **AI Chat Interface:** Real conversational chat powered by Llama 3.3 / Gemini via backend server APIs with streaming fallback architecture.
- **Persona:** Witty, Gen-Z lingo ("No cap", "Bet"), direct and actionable
- **Integrated AI:** Dashboard spending insights + FlowGoals savings plans + Full-text conversational Chat uses REAL LLM APIs (Groq + Gemini).

### 3.11. Sustainability — Eco Impact

> **Component:** `SustainabilityCard.tsx` • **Status:** 🔄 UI Built (Mock Data)

- **Eco Score:** 72/100 with "Good" rating
- **Impact Metrics:** -12kg CO2 saved, 340L water saved
- **Weekly Chart:** 7-day sustainability score trend (AreaChart)
- **CTA:** "View Green Insights" button

### 3.12. Onboarding & Setup

> **Components:** `Onboarding.tsx` + `InitialSetup.tsx` • **Status:** ✅ Built

- **Onboarding:** 8-slide auto-playing feature showcase with skip option
- **Profile Setup:** 7-step wizard — Name, City (GPS auto-detect), Vibe, Profession, Income, Identity Verification (Aadhaar/PAN/eKYC), Celebration
- **Working APIs:** GPS geolocation, Nominatim reverse geocoding, DiceBear avatars, Native Biometrics (Android FaceID/Fingerprint)
- **Security:** Identity vault created with on-device cryptographic keys (aes-gcm) ensuring biometric integrity without third-party KYC providers. Profile data not persisted to backend yet.

---

## 4. Technical Architecture

### Stack Summary

| Layer      | Technology                                | Version                 |
| ---------- | ----------------------------------------- | ----------------------- |
| Frontend   | React (TypeScript)                        | 19.2.4                  |
| Build Tool | Vite                                      | 6.2.0                   |
| Styling    | Tailwind CSS                              | 4.1.18                  |
| Animations | Framer Motion                             | 12.34.0                 |
| Charts     | Recharts                                  | 3.7.0                   |
| Backend    | Express.js                                | 5.2.1                   |
| Database   | Supabase (PostgreSQL)                     | Client v2.95.3          |
| AI Engine  | Google Gemini                             | `@google/genai` v1.39.0 |
| Mobile     | Capacitor                                 | 8.1.0                   |
| Auth       | Custom JWT + Google OAuth + Supabase Auth | —                       |
| State      | React Hooks / Context                     | —                       |
| PWA        | vite-plugin-pwa                           | 1.2.0                   |

### API Integration Status

| Metric                        | Count    |
| ----------------------------- | -------- |
| Total API Points Identified   | **83**   |
| ✅ Integrated (Real, Working) | 37 (45%) |
| 🔄 Ongoing (Mock/Partial)     | 10 (12%) |
| ❌ Pending (Not Built)        | 36 (43%) |

> 📄 See **`API_INTEGRATION_MAP.md`** for the complete 78-API registry with methods, endpoints, and explanations.

### Key Integrations Working

1. Supabase Auth (session management, ID token sign-in, auth state listener)
2. Supabase Database (profiles, app_users tables)
3. Google Sign-In — Web (GSI) + Android (Credential Manager via Capacitor plugin)
4. Express Auth Server (4 endpoints: google, mobile, me, logout)
5. Google Gemini AI (spending insights via Flash model + savings plans via Pro model)
6. OpenStreetMap Nominatim (reverse geocoding for city detection)
7. DiceBear (avatar generation)
8. PWA Service Worker (auto-updating)

---

## 5. Roadmap

### Phase 1: MVP ✅ (Current Status)

- [x] UI/UX Foundation — Cyber-Finance aesthetic with dark/light mode
- [x] 15 component architecture — all feature modules built
- [x] Dashboard with 11 data widgets and charts (Wired to Real API Data)
- [x] Secure Authentication — Google Sign-In (Web + Native) & Mobile OTP
- [x] Backend Layer — Express server with Supabase connection
- [x] AI Integration — Gemini Service (spending insights + savings plans)
- [x] Onboarding — 8-slide walkthrough + 7-step profile wizard
- [x] FlowPay — UPI simulation, QR scan UI, transaction ledger
- [x] FlowCredit — Credit gauge, What-If simulator, education module
- [x] FlowGoals — AI-powered savings plan generation
- [x] ExpenseTracker — Categorized tracking with anomaly detection
- [x] BillReminders — Due date tracking with overdue alerts
- [x] LoanMarketplace — EMI simulator, 6 loan products
- [x] SustainabilityCard — Eco impact scoring
- [x] ErrorBoundary — Crash protection with retry UI
- [x] PWA manifest and service worker
- [x] Capacitor Android project configured
- [x] Biometric Security Enhancements (Face ID/Fingerprint Step-up, local AES-GCM Vault)

### Phase 2: Data Integration ✅ (Tier 1 Complete)

- [x] **Supabase Tables:** Created `transactions`, `expenses`, `bills`, `goals`, `payments` + `dashboard_summary` view
- [x] **CRUD Operations:** Real Supabase queries replacing all mock data in apiService.ts
- [x] **API Routes:** Built 15 Express `/api/*` routes for core data operations
- [x] **Supabase RLS:** Row Level Security policies on all 5 new tables (20 policies)
- [x] **Toast System:** Glassmorphic, animated toast notifications with useToast() hook
- [x] **Skeleton Loaders:** 7 shimmer variants for loading states
- [x] **Error Handling:** FlowMintError class with classified error codes
- [ ] **Profile Persistence:** Save InitialSetup data to `profiles` table
- [ ] **SMS OTP:** Integrate Twilio/MSG91 for real mobile verification
- [ ] **Apple Sign-In:** Implement via Apple JS SDK + Supabase Apple provider

### Phase 3: External APIs 📡 (Integrations Sprint)

- [ ] **Account Aggregator (AA):** Real bank transaction data via AA framework APIs
- [x] **Credit Bureau:** CIBIL/Experian API for real credit score (Integrated via Apify)
- [ ] **UPI Payments:** Razorpay/PayU PSP for real UPI transactions
- [ ] **KYC Verification:** Digio/Surepass/IDfy for Aadhaar/PAN verification
- [ ] **Bill Payments:** BBPS via BillDesk/Razorpay for real bill payments
- [ ] **Push Notifications:** Firebase Cloud Messaging for bill reminders
- [ ] **Carbon Footprint:** Climatiq/Carbon Interface for sustainability scoring

### Phase 4: AI Enhancement 🧠

- [x] **Conversational AI Chat:** Implement robust Llama 3.3 / Gemini chat backend instead of keyword matching
- [ ] **Contextual Insights:** Complete user financial context injection
- [ ] **Streaming Responses:** SSE/WebSocket for real-time AI response streaming
- [ ] **Smart Categorization:** AI-powered expense categorization
- [ ] **Predictive Analytics:** Spending forecasts and budget recommendations

### Phase 5: Production Readiness 🚀

- [x] **Security Audit:** OWASP Top 10, rate limiting, CSP headers, strict Tailwind local bundling, input sanitization
- [ ] **Performance:** Code splitting, lazy loading, image optimization
- [ ] **Testing:** Unit tests, integration tests, E2E tests
- [ ] **Monitoring:** Error tracking (Sentry), analytics (Mixpanel/Amplitude)
- [ ] **Store Deployment:** Google Play Store & Apple App Store via Capacitor
- [ ] **Monetization:** FlowMint Black premium tier — lower fees, advanced AI, exclusive experiences

### Phase 6: Growth Features 🌱

- [ ] **Gamification Engine:** Points, badges ("Saver", "Investor", "Credit Master"), leaderboards
- [ ] **FlowCoins Reward System:** Earn coins for financial discipline, redeem for experiences
- [ ] **P2P Lending:** Peer-to-peer lending marketplace
- [ ] **Investment Module:** Fractional stocks, mutual fund collections
- [ ] **Cross-border Payments:** International transfer capability
- [ ] **Community Features:** Financial challenges with friends

---

## 6. User Journey Map

```
Install/Open App
│
├── First Time User
│   ├── Onboarding Slideshow (8 slides)
│   ├── Auth Screen
│   │   ├── Google Sign-In → Supabase Auth
│   │   ├── Mobile OTP → Express Backend
│   │   └── Apple Sign-In (Future)
│   ├── Initial Setup Wizard (7 steps)
│   │   ├── Name + City (GPS) + Vibe
│   │   ├── Profession + Income
│   │   └── Identity Verification (KYC)
│   └── → Dashboard
│
├── Returning User
│   ├── Session Check → Auto Login
│   └── → Dashboard
│
└── Dashboard (Command Center)
    ├── Home Tab → Balance, Charts, AI Insights, Sustainability
    ├── Pay Tab → FlowPay (UPI, Bills, EMIs)
    ├── Credit Tab → FlowCredit (Score, Simulator, Tips)
    ├── Goals Tab → FlowGoals (AI Plans), AIWishTracker
    ├── AI Tab → AIInsights (Feed + Chat)
    ├── FAB Menu → Expense Tracker, Bill Reminders
    ├── Navigation → Loan Marketplace, FlowLend
    └── Profile → Settings, Theme Toggle, Logout
```

---

## 7. Success Metrics

| Metric                 | Description                                    | Target                |
| ---------------------- | ---------------------------------------------- | --------------------- |
| **DAU/MAU**            | Daily/Monthly Active Users                     | 50K MAU in first year |
| **Retention**          | D30 retention rate                             | >40%                  |
| **Financial Health**   | Average credit score increase after 6 months   | +15 points            |
| **AI Engagement**      | Queries + insights generated per user per week | >5                    |
| **Feature Adoption**   | % of users using ≥3 features regularly         | >60%                  |
| **Transaction Volume** | Monthly UPI payment volume                     | ₹10Cr/month by Year 2 |
| **NPS**                | Net Promoter Score                             | >50                   |

---

## 8. Competitive Landscape

| Competitor | Strength               | FlowMint Advantage                                      |
| ---------- | ---------------------- | ------------------------------------------------------- |
| CRED       | Credit score + rewards | AI-powered advisory + expense tracking + sustainability |
| Jupiter    | Digital banking        | Multi-service ecosystem (loans + credit + goals)        |
| Fi Money   | Smart savings          | Deeper AI integration with Gemini Pro                   |
| PhonePe    | UPI payments           | Credit health + financial planning + gamification       |
| Groww      | Investments            | Lifestyle goals + eco-impact tracking                   |

---

## 9. Regulatory Considerations

| Area                      | Status                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| **NBFC Licensing**        | FlowMint is a technology partner, NOT a licensed NBFC. All loans processed by regulated partners. |
| **UPI Compliance**        | Will require NPCI approval + PSP license or partnership with licensed PSP.                        |
| **Data Protection**       | Must comply with DPDP Act 2023 (Digital Personal Data Protection).                                |
| **KYC/AML**               | Aadhaar eKYC and PAN verification required for financial services.                                |
| **RBI Guidelines**        | All lending partners must be RBI-regulated NBFCs/Banks.                                           |
| **Sustainability Claims** | Eco-impact metrics should be based on verified emission factor databases.                         |

---

> **Document Owner:** FlowMint Product Team  
> **Review Cycle:** Monthly  
> **Related Documents:** `DOCUMENTATION.md` (Technical) • `KNOWLEDGEBASE.md` (Design System) • `API_INTEGRATION_MAP.md` (API Registry)
