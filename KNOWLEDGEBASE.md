# FlowMint Knowledgebase & Design System

> **Version:** 2.1 • **Last Updated:** 20 March 2026

---

## 1. Design Philosophy

FlowMint adopts a **"Cyber-Finance"** aesthetic — a premium, dark-mode-first design language that makes financial management feel futuristic and aspirational rather than tedious.

### Design Principles

| Principle               | Implementation                                                         |
| ----------------------- | ---------------------------------------------------------------------- |
| **Dark Mode First**     | Deep black (`#0A0A0A`) backgrounds with high-contrast neon accents     |
| **Glassmorphism**       | Semi-transparent cards with backdrop blur for depth and hierarchy      |
| **Fluid Motion**        | Every interaction has purposeful animation via Framer Motion           |
| **Neon Accents**        | Brand mint green (`#00FFA3`) as primary action color with glow effects |
| **Information Density** | Financial data displayed in scannable, widget-based layouts            |
| **Mobile-First**        | All components designed for 375px–430px width, scaling up for desktop  |

### Color Palette (CSS Variables)

| Variable          | Dark Mode Value             | Light Mode Value         | Usage                                     |
| ----------------- | --------------------------- | ------------------------ | ----------------------------------------- |
| `--brand-primary` | `#00FFA3`                   | `#00CC82`                | Primary actions, success states, branding |
| `--brand-glow`    | `rgba(0, 255, 163, 0.15)`   | `rgba(0, 204, 130, 0.1)` | Box shadows, background glows             |
| `--bg-color`      | `#0A0A0A`                   | `#F8F9FA`                | Page background                           |
| `--text-color`    | `#FFFFFF`                   | `#111111`                | Primary text                              |
| `--glass-border`  | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)`    | Card borders, dividers                    |
| `--card-subtle`   | `rgba(255, 255, 255, 0.03)` | `rgba(0, 0, 0, 0.03)`    | Card backgrounds, input fields            |

### Typography

- **Font Stack:** System UI / Inter — optimized for readability on mobile
- **Weight System:** `font-bold` (500) for body, `font-black` (900) for headers and labels
- **Case Convention:** `uppercase tracking-widest` for labels and categories
- **Size Hierarchy:**
  - `text-3xl font-black` — Page titles
  - `text-xl font-black` — Section headers
  - `text-sm font-bold` — Card titles
  - `text-[10px] uppercase tracking-widest` — Labels and metadata
  - `text-[8px]`/`text-[9px]` — Micro labels (status badges, chart labels)

### Spacing & Radius System

| Element         | Border Radius      | Padding          |
| --------------- | ------------------ | ---------------- |
| Full-page cards | `rounded-[2.5rem]` | `p-8`            |
| Standard cards  | `rounded-[2rem]`   | `p-6`            |
| List items      | `rounded-[1.8rem]` | `p-4` to `p-5`   |
| Small cards     | `rounded-[1.5rem]` | `p-3` to `p-4`   |
| Buttons         | `rounded-2xl`      | `py-3` to `py-4` |
| Chips/Badges    | `rounded-full`     | `px-3 py-1`      |
| Inputs          | `rounded-2xl`      | `h-16 px-6`      |

---

## 2. Component Library (15 Components)

### App Shell (`App.tsx`)

- **Purpose:** Root component — manages auth state, theme, navigation, and layout
- **State Management:** React hooks (`useState`, `useEffect`) + Supabase auth listeners
- **Theme Switching:** `document.body.classList.toggle('light')` + CSS variable overrides
- **Navigation:** Bottom tab bar with 5 tabs + floating action button (FAB) for quick actions
- **Routing:** State-driven (`activeTab`) — AnimatePresence for crossfade transitions
- **Error Handling:** Wraps all content in `<ErrorBoundary>`

### Dashboard (`Dashboard.tsx`) — 432 lines

- **Purpose:** Financial command center — the landing page after login
- **Widgets:**
  - Balance Card — total liquidity with hide/show toggle
  - Wealth History — AreaChart tracking balance over time
  - Daily Spending — BarChart with per-day breakdown
  - Weekly Trend — AreaChart showing spend vs. limit
  - Credit Score — mini gauge (782)
  - EMI Stress — ratio indicator (36%)
  - Upcoming Bills — count + total due
  - Loan Readiness — percentage indicator
  - AI Insight — Gemini-generated spending personality
  - Recent Transactions — list from apiService
  - Sustainability Card — embedded component
- **Real API Calls:** `apiService.getTransactions()`, `getSpendingInsights()` (Gemini)
- **Mock Data:** Balance, credit score, EMI data, wealth history, spending charts

### Auth (`Auth.tsx`) — 632 lines

- **Purpose:** Full authentication flow with 4 screens (Welcome → Mobile → OTP → Handshake)
- **Flows Supported:**
  - Google Sign-In (Web via GSI)
  - Google Sign-In (Android via Capacitor plugin)
  - Mobile OTP (simulated — hardcoded `021303`)
  - Apple Sign-In (mocked)
- **Integration Points:**
  - `supabase.auth.signInWithIdToken()` — both web and native
  - `POST /auth/mobile` — Express backend
  - Direct Supabase `app_users` query as fallback (Capacitor mode)

### Onboarding (`Onboarding.tsx`) — 188 lines

- **Purpose:** Feature showcase slideshow for first-time users
- **Slides:** 8 auto-playing slides (5s intervals) covering all product pillars
- **No API calls** — purely frontend
- **UX:** Skip button + manual "Continue" + segmented progress bar

### InitialSetup (`InitialSetup.tsx`) — 662 lines

- **Purpose:** Multi-step profile setup wizard (7 steps)
- **Steps:** Name → City (auto-detect) → Vibe Selection → Profession → Income → Identity (Aadhaar/PAN + eKYC) → Celebration
- **Real APIs:**
  - `navigator.geolocation.getCurrentPosition()` — GPS
  - Nominatim reverse geocoding — city detection
  - DiceBear avatars — avatar generation
  - Biometric Enclaves via Web Crypto API/Capacitor plugins.
- **Security:** eKYC Biometric verify uses web crypto and device enclaves to secure private keys, bypassing third party providers.
- **Gap:** Profile data is NOT persisted to backend (stays in local state)

### FlowPay (`FlowPay.tsx`) — 308 lines

- **Features:** QR Scan & Pay, Send Money modal, Upcoming EMIs (3), Pay Services grid (8 categories), Transaction Ledger
- **Mock Data:** All — `PAYMENT_HISTORY` (6 records), EMIs hardcoded, payments simulated
- **UX Detail:** Simulated Mode badge shown on QR scanner and payment success screens

### FlowCredit (`FlowCredit.tsx`) — 423 lines

- **Features:** SVG arc gauge (credit score 782), score history chart, credit behavior indicators (3 cards), credit education accordion, What-If simulator, actionable tips
- **Simulator Logic:** `useMemo` adjusts predicted score based on: debt repayment slider (up to +35), new card toggle (-8), loyalty streak (+12), close old account (-15)
- **Mock Data:** All — score, history, utilization, tips are hardcoded
- **Label:** Explicitly shows "Manual / Estimated Score – Bureau integration coming soon"

### FlowGoals (`FlowGoals.tsx`) — 133 lines

- **Features:** Goal cards (Tokyo Trip, MacBook Pro), AI savings plan generator, recommended plan suggestions
- **Real API:** `getWishTrackerPlan()` → Gemini Pro with thinking mode
- **Mock Data:** Goals themselves are hardcoded inline

### ExpenseTracker (`ExpenseTracker.tsx`) — 393 lines

- **Features:** Expense list with category icons, add expense modal, anomaly detection alert, monthly trend bar chart, category breakdown with progress bars, filter chips
- **Smart Feature:** `suggestCategory()` — auto-suggests category based on title keywords (regex matching)
- **Mock Data:** `MOCK_EXPENSES` (10 items), `MONTHLY_DATA` (4 months)
- **Gap:** New expenses added to local state only, not persisted

### BillReminders (`BillReminders.tsx`) — 222 lines

- **Features:** Overdue alert banner, summary cards (total due + EMI stress), EMI-to-income ratio meter, filter tabs (All/Upcoming/Overdue/Paid), bill list with pay button, AI late fee advisory
- **Mock Data:** `MOCK_BILLS` (8 bills with various statuses)
- **Gap:** `markPaid()` updates local state only

### AIWishTracker (`AIWishTracker.tsx`)

- **Features:** Wishlist with progress bars, add new wish modal, total wishlist value summary, monthly saving estimate
- **Mock Data:** `MOCK_WISHES` (3 items)
- **Gap:** Wishes not persisted; saving rate hardcoded at ₹18,500/month

### AIInsights (`AIInsights.tsx`) — 205 lines

- **Features:** Smart Insights feed (6 cards), AI Chat interface with message bubbles
- **Chat Logic:** `handleSend()` passes user context + queries to the `/api/ai/chat` Express endpoint powered by Groq (Llama 3.3).
- **Mock Data:** Initial AI_INSIGHTS (6 cards) are predefined, but conversational chat uses real LLM.
- **Gap:** Pre-loaded mock insight cards could eventually pull context-aware real history from backend.

### LoanMarketplace (`LoanMarketplace.tsx`) — 232 lines

- **Features:** Pre-approved hero card, readiness indicators (3 cards), EMI simulator with amount/tenure sliders, loan product list (6 products), eligibility scoring
- **Local Math:** `calculateEMI()` — standard EMI formula, works correctly
- **Mock Data:** `LOAN_PRODUCTS` (6), all eligibility scores hardcoded
- **Label:** "Simulated Mode" disclosure at bottom

### FlowLend (`FlowLend.tsx`) — 87 lines

- **Features:** Pre-approved offer card, 3 lending partner cards (HDFC, Muthoot, ICICI), regulated access disclaimer
- **Mock Data:** All data hardcoded
- **Gap:** "Get Instant Cash" button has no action handler

### SustainabilityCard (`SustainabilityCard.tsx`) — 117 lines

- **Features:** Eco score gauge, CO2 saved (-12kg), water saved (340L), weekly green data chart, "View Green Insights" button
- **Mock Data:** All — `GREEN_DATA` (7 days), score, metrics hardcoded

### ErrorBoundary (`ErrorBoundary.tsx`) — 62 lines

- **Type:** React Class Component (required for error boundaries)
- **Behavior:** Catches unhandled errors in child tree → shows friendly UI with error message + "Restart App" button
- **Usage:** Wraps `<Auth>` and main content in `App.tsx`

---

## 3. Services Layer

### `geminiService.ts` — AI Integration

```typescript
// Two exported functions:
getSpendingInsights(transactions: any[])  → string  // Uses gemini-3-flash-preview
getWishTrackerPlan(goal, amount, savings) → string  // Uses gemini-3-pro-preview (thinking)
```

**Key Pattern:** Creates a new `GoogleGenAI` instance per function call using `process.env.GEMINI_API_KEY`. This ensures the latest key is always used and avoids stale instances.

**Prompt Engineering:**

- Persona: "Witty financial genius for Indian Millennials"
- Output: Short, actionable, culturally relevant (Indian context)
- Model selection: Flash for speed, Pro+Thinking for complex plans

### `apiService.ts` — Mock Data Service

```typescript
// Four mock endpoints with artificial delays (200ms):
apiService.getTransactions()  → Transaction[]   // 6 mock transactions
apiService.getBills()         → Bill[]           // 4 mock bills
apiService.getGoals()         → WishGoal[]       // 3 mock goals
apiService.getLoanOffers()    → LoanOffer[]      // 3 mock loan offers
```

**Note:** Only `getTransactions()` is actually called (by Dashboard.tsx). The others exist but are unused — components use their own inline hardcoded data instead.

### `supabase.ts` — Database Client

```typescript
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

Used for both authentication (`supabase.auth.*`) and direct database queries (`supabase.from('profiles').*`).

---

## 4. Custom Plugins

### `plugins/GoogleAuth.ts`

Custom Capacitor plugin that bridges to Android's Credential Manager API for native Google Sign-In:

```typescript
interface GoogleAuthPlugin {
  signIn(options: { clientId: string }): Promise<GoogleAuthResult>;
  signOut(): Promise<void>;
}
```

- Registered via `registerPlugin<GoogleAuthPlugin>('GoogleAuth')`
- Returns `{ idToken, email, displayName, photoUrl }`
- **Web fallback:** On web, this plugin is `undefined` — the app uses GSI instead

---

## 5. Common Patterns & Best Practices

### Theming

- CSS class-based theme switch: `document.body.classList.add('light')`
- All colors MUST use CSS variables: `var(--bg-color)`, `var(--text-color)`, etc.
- Inline `style={{ color: 'var(--text-color)' }}` is used alongside Tailwind for theme-safe colors
- The `.theme-transition` utility class adds smooth color transitions when switching themes

1. Did you build first? → `npm run build && npx cap sync`
2. Check Android Studio Logcat for JavaScript errors
3. Verify environment variables are set (Vite replaces them at build time)

### Google Sign-In Not Working

- **Web:** Check that `GOOGLE_CLIENT_ID` is set and the origin is allowed in Google Cloud Console
- **Android:** Verify SHA-1 fingerprint is registered; check `GoogleAuthPlugin` is registered in `MainActivity`
- **Capacitor:** Ensure `npx cap sync` was run after web build

### AI Insights Not Loading

- Verify `GEMINI_API_KEY` is set in `.env`
- Check console for API quota errors
- Note: Gemini creates a new instance per call — stale key issues shouldn't occur

### Theme Not Applying

- Colors must use `var(--variable-name)`, not hardcoded hex values
- Check that the `.light` class is being toggled on `document.body`
- Add `.theme-transition` class for smooth switching

### Express Server Connection Refused

- Ensure both servers are running: `npm run dev` (uses `concurrently`)
- Frontend-only: `npm run dev:frontend` — Express routes will fail, but Supabase auth fallback works
- Check Vite proxy config if API requests return 404

## 9. Mobile AI Troubleshooting (New)

### 1. AI Features Return 401 on Mobile

- **Cause**: The mobile app uses Supabase Auth, but the Express server expects a cookie.
- **Solution**: The app sends the Supabase session token in the `Authorization: Bearer <token>` header. Ensure your server's `authenticateToken` middleware supports both Cookies and Bearer tokens.

### 2. "Network Error" / Connection Refused

- **Cause**: The app is trying to reach `localhost:3000`. On an Android device, `localhost` refers to the phone itself.
- **Solution**: Use your PC's LAN IP or a deployed URL instead of localhost. The `llmService.ts` file automatically detects Capacitor and uses `VITE_API_SERVER_URL` or falls back to a production URL.
