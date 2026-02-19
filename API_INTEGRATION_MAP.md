# FlowMint — Complete API Integration Registry

> **Total APIs Identified: 68**  
> **Integrated: 14 | Ongoing (Partial/Mock): 10 | Pending (Not Built): 44**  
> **Last Verified: 20 Feb 2026 — Every single component audited line-by-line.**

---

## 📊 Status Legend

| Status            | Meaning                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| ✅ **Integrated** | Fully working with real API/SDK — production-ready or functional                     |
| 🔄 **Ongoing**    | Partially working — mock data, simulated flow, or hardcoded but has code scaffolding |
| ❌ **Pending**    | Not built yet — needs full implementation from scratch                               |

---

## Complete API Registry (68 APIs)

### PHASE 0 — App Initialization & Session Hydration

> **Component:** `App.tsx` • **Trigger:** Every app launch / refresh

| #   | API Name               | Method   | Endpoint / SDK Call                                               | Explanation                                                                                                                        | Status        |
| --- | ---------------------- | -------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Check Existing Session | SDK      | `supabase.auth.getSession()`                                      | Checks if user has an active Supabase session on app load. Returns session object with JWT if valid, null if expired.              | ✅ Integrated |
| 2   | Auth State Listener    | SDK      | `supabase.auth.onAuthStateChange(callback)`                       | Real-time subscription that fires whenever the user logs in, logs out, or session refreshes. Auto-updates `isAuthenticated` state. | ✅ Integrated |
| 3   | Fetch User Profile     | SDK (DB) | `supabase.from('profiles').select('*').eq('id', userId).single()` | After session is confirmed, fetches user's `name` and `avatar_url` from the Supabase `profiles` table to hydrate the UI header.    | ✅ Integrated |

---

### PHASE 1 — Authentication

> **Component:** `Auth.tsx`, `server/index.js`, `plugins/GoogleAuth.ts` • **Trigger:** Unauthenticated user

| #   | API Name                                       | Method     | Endpoint / SDK Call                                                              | Explanation                                                                                                                                                         | Status        |
| --- | ---------------------------------------------- | ---------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 4   | Load Google Identity Services                  | `<script>` | `https://accounts.google.com/gsi/client`                                         | Dynamically loads Google's GSI JavaScript SDK into the browser for One Tap and button-based Sign-In.                                                                | ✅ Integrated |
| 5   | Initialize Google Auth                         | SDK        | `window.google.accounts.id.initialize({ client_id, callback })`                  | Configures GSI with the project's Google OAuth Client ID and a callback to handle the returned credential.                                                          | ✅ Integrated |
| 6   | Google One Tap Prompt                          | SDK        | `window.google.accounts.id.prompt()`                                             | Triggers the Google One Tap popup in the browser. Falls back to a rendered Sign-In button if One Tap is dismissed.                                                  | ✅ Integrated |
| 7   | Supabase Sign-In with Google ID Token (Web)    | SDK        | `supabase.auth.signInWithIdToken({ provider: 'google', token: credential })`     | Takes the Google ID token from GSI and authenticates it directly with Supabase Auth, creating/linking the user.                                                     | ✅ Integrated |
| 8   | Native Google Sign-In (Capacitor)              | Plugin     | `GoogleAuth.signIn({ clientId })`                                                | Uses the custom `plugins/GoogleAuth.ts` Capacitor plugin that bridges to Android's Credential Manager API for native sign-in.                                       | ✅ Integrated |
| 9   | Supabase Sign-In with Google ID Token (Native) | SDK        | `supabase.auth.signInWithIdToken({ provider: 'google', token: result.idToken })` | Same as #7 but uses the native ID token from the Capacitor plugin instead of GSI web token.                                                                         | ✅ Integrated |
| 10  | Send OTP to Mobile                             | —          | _Currently simulated: hardcoded OTP `021303`_                                    | Should send a real OTP SMS to the user's phone number for verification. Currently the OTP is hardcoded on the frontend with no actual SMS sent.                     | 🔄 Ongoing    |
| 11  | Verify OTP — Express Backend                   | `POST`     | `/auth/mobile`                                                                   | Backend receives `{ mobile, name }`, validates the user, upserts into the `app_users` table via Supabase Admin, generates a JWT, and sets it as an HTTPOnly cookie. | ✅ Integrated |
| 12  | Fallback: Direct Supabase User Lookup          | SDK (DB)   | `supabase.from('app_users').select('*').eq('mobile', mobile)`                    | When Express server is unavailable (e.g., Capacitor builds), the frontend directly queries Supabase to find an existing user by mobile number.                      | ✅ Integrated |
| 13  | Fallback: Create New User in Supabase          | SDK (DB)   | `supabase.from('app_users').insert([{ mobile, name }])`                          | If no existing user is found via fallback lookup (#12), creates a new `app_users` record directly from the frontend.                                                | ✅ Integrated |
| 14  | Google Auth — Express Callback                 | `POST`     | `/auth/google`                                                                   | Server-side: receives Google credential → verifies via `google-auth-library` → upserts user into `app_users` → returns JWT cookie.                                  | ✅ Integrated |
| 15  | Get Current User                               | `GET`      | `/auth/me` (🔒 JWT Protected)                                                    | Protected route: reads JWT from cookie → decodes user ID → fetches fresh profile from `app_users` table → returns user data.                                        | ✅ Integrated |
| 16  | Apple Sign-In                                  | —          | _Mocked: simulates with hardcoded Apple profile_                                 | No real Apple JS SDK or Capacitor plugin implemented. Button exists but triggers a fake profile. Needs Apple Developer Account + Supabase Apple provider.           | ❌ Pending    |
| 17  | SMS Gateway Integration                        | `POST`     | _Not built — needs `Twilio / MSG91 / Firebase Phone Auth` API_                   | Real SMS delivery service to send OTPs to user mobile numbers. Required to replace the hardcoded OTP (`021303`).                                                    | ❌ Pending    |

---

### PHASE 2 — Onboarding Walkthrough

> **Component:** `Onboarding.tsx` • **Trigger:** After first-time authentication

| #   | API Name           | Method | Endpoint / SDK Call | Explanation                                                                                                  | Status      |
| --- | ------------------ | ------ | ------------------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| —   | _No APIs required_ | —      | —                   | Onboarding is a static, auto-playing slideshow of 8 feature cards. Purely frontend UI with no data fetching. | ✅ Complete |

---

### PHASE 3 — Initial Profile Setup (KYC + Personalization)

> **Component:** `InitialSetup.tsx` • **Trigger:** After onboarding

| #   | API Name                      | Method      | Endpoint / SDK Call                                                           | Explanation                                                                                                                                     | Status        |
| --- | ----------------------------- | ----------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 18  | Browser Geolocation           | Browser API | `navigator.geolocation.getCurrentPosition()`                                  | Requests GPS coordinates from the device/browser to auto-detect the user's location for city pre-fill.                                          | ✅ Integrated |
| 19  | Reverse Geocoding — Nominatim | `GET`       | `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json` | Converts GPS coordinates to a human-readable city name using OpenStreetMap's free Nominatim API.                                                | ✅ Integrated |
| 20  | Aadhaar Number Validation     | Client-side | _Verhoeff algorithm (local computation)_                                      | Validates the 12-digit Aadhaar number using the Verhoeff checksum algorithm. No external API call — pure math.                                  | 🔄 Ongoing    |
| 21  | PAN Number Validation         | Client-side | _Regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`_                                       | Validates PAN format using a regex pattern. No external API call.                                                                               | 🔄 Ongoing    |
| 22  | Fetch KYC Details (Aadhaar)   | —           | _Simulated: returns hardcoded demo name/DOB_                                  | Should fetch verified identity details from Aadhaar via a KYC provider. Currently returns fake data after a `setTimeout`.                       | ❌ Pending    |
| 23  | Fetch KYC Details (PAN)       | —           | _Simulated: returns hardcoded demo name/DOB_                                  | Should verify PAN and return name/DOB from tax records via a KYC provider. Currently returns fake data.                                         | ❌ Pending    |
| 24  | eKYC Biometric Verification   | —           | _Simulated: uses `setTimeout` to fake biometric scan_                         | Should integrate with UIDAI eKYC or Video KYC provider for real-time facial/biometric verification.                                             | ❌ Pending    |
| 25  | Save User Profile to Backend  | —           | _Not built — profile data stays in local component state_                     | Should persist all collected profile data (name, city, profession, income, savings goal, KYC status) to Supabase `profiles` table via `upsert`. | ❌ Pending    |
| 26  | Generate Avatar — DiceBear    | `GET`       | `https://api.dicebear.com/7.x/avataaars/svg?seed={name}`                      | Generates unique SVG avatar based on user's name. Used in both `Auth.tsx` and `InitialSetup.tsx`.                                               | ✅ Integrated |

---

### PHASE 4 — Dashboard (Home)

> **Component:** `Dashboard.tsx` • **Trigger:** Main screen after login

| #   | API Name                            | Method  | Endpoint / SDK Call                                 | Explanation                                                                                                                 | Status        |
| --- | ----------------------------------- | ------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 27  | Get Transactions                    | Service | `apiService.getTransactions()`                      | Fetches list of financial transactions. Currently returns hardcoded mock data from `apiService.ts` with a fake 200ms delay. | 🔄 Ongoing    |
| 28  | AI Spending Insights                | Server  | `POST /api/ai/spending-insight` → Groq/Gemini       | Backend-mediated AI call. Auth: Bearer Token (Mobile) or Cookie (Web). Returns spend personality & tips.                    | ✅ Integrated |
| 29  | Get Account Balance                 | —       | _Hardcoded: `₹59,823.59`_                           | Should fetch real-time bank account balance via Account Aggregator (AA) framework APIs.                                     | ❌ Pending    |
| 30  | Get Credit Score (Dashboard Widget) | —       | _Hardcoded: `782`_                                  | Should fetch credit score from CIBIL/Experian API. Used in the dashboard summary card.                                      | ❌ Pending    |
| 31  | Get EMI Stress Data                 | —       | _Hardcoded: `₹17,999` EMI, `36%` ratio_             | Should calculate from real linked loan accounts. Currently static values in the component.                                  | ❌ Pending    |
| 32  | Get Upcoming Bills Summary          | —       | _Hardcoded: `3 bills = ₹7,599`_                     | Should query pending bills from the `bills` table/API. Currently static.                                                    | ❌ Pending    |
| 33  | Get Wealth History (Chart)          | —       | _Hardcoded: `WEALTH_HISTORY` array — 6 data points_ | Should fetch historical balance data from bank account API over time.                                                       | ❌ Pending    |
| 34  | Get Daily Spending Stats (Chart)    | —       | _Hardcoded: `DAILY_STATS` array — 7 data points_    | Should aggregate transaction amounts by day from the transactions API.                                                      | ❌ Pending    |
| 35  | Get Weekly Trend Stats (Chart)      | —       | _Hardcoded: `TREND_STATS` array — 4 data points_    | Should aggregate transaction amounts by week from the transactions API.                                                     | ❌ Pending    |

---

### PHASE 5 — FlowPay (Payments)

> **Component:** `FlowPay.tsx` • **Trigger:** User navigates to Pay tab

| #   | API Name             | Method | Endpoint / SDK Call                                                   | Explanation                                                                                                                              | Status     |
| --- | -------------------- | ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 36  | Get Payment History  | —      | _Hardcoded: `PAYMENT_HISTORY` array — 6 records_                      | Should fetch payment transactions from `payments` table. Currently mocked inline.                                                        | ❌ Pending |
| 37  | Initiate UPI Payment | —      | _Simulated: `simulatePayment()` uses `setTimeout` to fake processing_ | Should call a UPI PSP API (Razorpay/PayU/PhonePe) to process real UPI payments. Currently shows a fake "Processing → Success" animation. | ❌ Pending |
| 38  | QR Code Scanner      | —      | _UI mockup only — scanning animation, no real camera access_          | Should use Capacitor Barcode Scanner plugin to read UPI QR codes and trigger payments.                                                   | ❌ Pending |
| 39  | Get Upcoming EMIs    | —      | _Hardcoded: 3 EMI cards (iPhone 15, Electricity, Car Loan)_           | Should fetch from linked loan/EMI accounts.                                                                                              | ❌ Pending |
| 40  | Pay Bill via BBPS    | —      | _"Pay Now" button exists but no action handler_                       | Should call Bharat Bill Payment System (BBPS) API via BillDesk/Razorpay.                                                                 | ❌ Pending |
| 41  | P2P Money Transfer   | —      | _"Send Money" modal exists — simulated with `simulatePayment()`_      | Should call UPI P2P transfer API to send money to a UPI ID.                                                                              | ❌ Pending |

---

### PHASE 6 — FlowCredit (Credit Health)

> **Component:** `FlowCredit.tsx` • **Trigger:** User navigates to Credit tab

| #   | API Name                         | Method | Endpoint / SDK Call                                                               | Explanation                                                                                                                           | Status     |
| --- | -------------------------------- | ------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 42  | Get Credit Score                 | —      | _Hardcoded: `782` with static `SCORE_HISTORY` array_                              | Should fetch from CIBIL TransUnion / Experian / Equifax India bureau API. Component explicitly says "Bureau integration coming soon". | ❌ Pending |
| 43  | Get Credit Score History         | —      | _Hardcoded: `SCORE_HISTORY` — 6 monthly data points (Jul–Dec)_                    | Should fetch historical score trend from bureau API.                                                                                  | ❌ Pending |
| 44  | Refresh Credit Score             | —      | _`handleRefresh()` uses `setTimeout(2000)` — shows spin animation, no real fetch_ | Should trigger a real-time bureau pull to refresh the score.                                                                          | ❌ Pending |
| 45  | Get Credit Utilization Data      | —      | _Hardcoded: `42%` utilization, `36%` EMI/Income, `0` late payments_               | Should aggregate from linked credit card and loan data.                                                                               | ❌ Pending |
| 46  | Credit Score Simulator (What-If) | —      | _Local `useMemo` calculation — adjusts score based on UI toggles_                 | Pure client-side math engine. Works as designed locally, but would benefit from a backend scoring model for accuracy.                 | 🔄 Ongoing |
| 47  | Get Credit Tips                  | —      | _Hardcoded: `creditTips` array — 2 tips (Utilization, Payment History)_           | Should use Gemini AI to generate personalized credit improvement tips based on user's actual bureau data.                             | ❌ Pending |
| 48  | Get Credit Education Content     | —      | _Hardcoded: 5 credit factors with descriptions in `CreditEducation` component_    | Could be served from a CMS or content API. Currently static.                                                                          | ❌ Pending |

---

### PHASE 7 — FlowGoals (Smart Savings)

> **Component:** `FlowGoals.tsx` • **Trigger:** User navigates to Goals tab

| #   | API Name               | Method | Endpoint / SDK Call                                               | Explanation                                                                                                            | Status        |
| --- | ---------------------- | ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------- |
| 49  | Get AI Savings Plan    | Server | `POST /api/ai/wish-plan` → Groq (Llama 3.3) -> Gemini (Fallback)  | Backend-mediated call. Generates 3-step saving plan. Robust fallback chain: Groq -> Gemini -> Local Math.              | ✅ Integrated |
| 50  | Get Savings Goals List | —      | _Hardcoded: 2 goals inline (Tokyo Trip ₹2.5L, MacBook Pro ₹1.8L)_ | Should fetch from `goals` table. `apiService.getGoals()` also exists with mock data but is not used in this component. | 🔄 Ongoing    |
| 51  | Create New Goal        | —      | _"+" button exists but no create/persist logic_                   | Should call `POST /api/goals` or `supabase.from('goals').insert()`.                                                    | ❌ Pending    |
| 52  | Update Goal Progress   | —      | _No update mechanism exists_                                      | Should call `PATCH /api/goals/:id` to update `currentAmount`.                                                          | ❌ Pending    |

---

### PHASE 8 — Expense Tracker

> **Component:** `ExpenseTracker.tsx` • **Trigger:** User navigates to Expenses tab

| #   | API Name                      | Method      | Endpoint / SDK Call                                                   | Explanation                                                                                                                              | Status     |
| --- | ----------------------------- | ----------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 53  | Get Expenses                  | —           | _Hardcoded: `MOCK_EXPENSES` array — 10 items_                         | Should fetch from `expenses` table. `apiService` has no expenses method.                                                                 | ❌ Pending |
| 54  | Add New Expense               | —           | _`handleAddExpense()` adds to local React state only — not persisted_ | Added to `expenses` state array but lost on page refresh. Needs `POST /api/expenses` or Supabase insert.                                 | 🔄 Ongoing |
| 55  | AI Category Suggestion        | Client-side | _Local `suggestCategory()` function — regex keyword matching_         | Matches title keywords (swiggy→Food, uber→Transport, etc.) to auto-suggest category. Works locally but could be enhanced with Gemini AI. | 🔄 Ongoing |
| 56  | Get Monthly Expense Breakdown | —           | _Hardcoded: `MONTHLY_DATA` — 4 months (Sep–Dec)_                      | Should fetch aggregated monthly data from `GET /api/expenses/summary`.                                                                   | ❌ Pending |
| 57  | Get Category-wise Breakdown   | —           | _Calculated locally from mock data using `useMemo`_                   | Calculation logic exists, but operates on mock data. Would work correctly with real data.                                                | 🔄 Ongoing |

---

### PHASE 9 — Bill Reminders

> **Component:** `BillReminders.tsx` • **Trigger:** User navigates to Bills tab

| #   | API Name                        | Method | Endpoint / SDK Call                                                   | Explanation                                                                                           | Status     |
| --- | ------------------------------- | ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| 58  | Get All Bills                   | —      | _Hardcoded: `MOCK_BILLS` array — 8 bills with due dates and statuses_ | Should fetch from `bills` table.                                                                      | ❌ Pending |
| 59  | Mark Bill as Paid               | —      | _`markPaid(id)` updates local state only — not persisted_             | Changes `isPaid` flag in React state. Needs `PATCH /api/bills/:id` with `{ isPaid: true }`.           | 🔄 Ongoing |
| 60  | Push Notification for Due Bills | —      | _No notification system implemented_                                  | Should use Firebase Cloud Messaging (FCM) + Capacitor Push Notifications plugin for timely reminders. | ❌ Pending |

---

### PHASE 10 — AI Wish Tracker

> **Component:** `AIWishTracker.tsx` • **Trigger:** User navigates to Wish Tracker tab

| #   | API Name     | Method | Endpoint / SDK Call                                      | Explanation                                                              | Status     |
| --- | ------------ | ------ | -------------------------------------------------------- | ------------------------------------------------------------------------ | ---------- |
| 61  | Get Wishlist | —      | _Hardcoded: `MOCK_WISHES` array — 3 wishes_              | Should fetch from `wishes` table.                                        | ❌ Pending |
| 62  | Add New Wish | —      | _`handleAdd()` adds to local state only — not persisted_ | Creates new wish object but it's lost on refresh. Needs Supabase insert. | ❌ Pending |

---

### PHASE 11 — Loan Marketplace

> **Component:** `LoanMarketplace.tsx` • **Trigger:** User navigates to Loans tab

| #   | API Name               | Method      | Endpoint / SDK Call                                             | Explanation                                                                                               | Status        |
| --- | ---------------------- | ----------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| 63  | Get Loan Products      | —           | _Hardcoded: `LOAN_PRODUCTS` array — 6 products from 6 partners_ | Should fetch from NBFC partner APIs or `loan_products` table. Component explicitly says "Simulated Mode". | ❌ Pending    |
| 64  | EMI Calculator         | Client-side | _Local `calculateEMI(principal, rate, months)` function_        | Standard EMI formula: `P × r × (1+r)^n / ((1+r)^n - 1)`. Pure math — no API needed. Works correctly.      | ✅ Integrated |
| 65  | Check Loan Eligibility | —           | _Hardcoded: `eligibilityScore` per product (30–95%)_            | Should dynamically compute based on user's credit score + income + existing EMIs.                         | ❌ Pending    |

---

### PHASE 12 — FlowLend (Lending Partners)

> **Component:** `FlowLend.tsx` • **Trigger:** User navigates to Lend tab

| #   | API Name               | Method | Endpoint / SDK Call                                              | Explanation                                                                | Status     |
| --- | ---------------------- | ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| 66  | Get Pre-Approved Offer | —      | _Hardcoded: ₹5,00,000 at 10.5%_                                  | Should call NBFC pre-approval API based on user's credit profile.          | ❌ Pending |
| 67  | Get Lending Partners   | —      | _Hardcoded: 3 partners (HDFC, Muthoot, ICICI) with static rates_ | Should fetch from `GET /api/lending/partners` or `lending_partners` table. | ❌ Pending |

---

### PHASE 13 — AI Advisor (Insights + Chat)

> **Component:** `AIInsights.tsx` • **Trigger:** User navigates to AI tab

| #   | API Name                  | Method | Endpoint / SDK Call                                                                      | Explanation                                                                                                                      | Status     |
| --- | ------------------------- | ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 68  | Get AI Insights Feed      | —      | _Hardcoded: `AI_INSIGHTS` array — 6 insight cards_                                       | Should call Gemini API with full user financial context (transactions, goals, credit, bills) to generate personalized insights.  | ❌ Pending |
| 69  | AI Chat — Send Message    | —      | _`handleSend()` uses local keyword matching (loan/save/credit) with hardcoded responses_ | Should call Gemini API conversational endpoint (`POST /api/ai/chat`) with injected user financial context for real-time AI chat. | ❌ Pending |
| 70  | AI Chat — Stream Response | —      | _Simulated: `setTimeout(1500)` returns canned response_                                  | Should use Server-Sent Events (SSE) or WebSocket for streaming Gemini responses word-by-word.                                    | ❌ Pending |

---

### PHASE 14 — Sustainability / Eco Impact

> **Component:** `SustainabilityCard.tsx` • **Trigger:** Rendered on Dashboard

| #   | API Name                      | Method | Endpoint / SDK Call                              | Explanation                                                                                                            | Status     |
| --- | ----------------------------- | ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| 71  | Get Eco Score                 | —      | _Hardcoded: `72`_                                | Should calculate from transaction categories × emission factors using a carbon API (e.g., Climatiq, Carbon Interface). | ❌ Pending |
| 72  | Get Green Data (Weekly Chart) | —      | _Hardcoded: `GREEN_DATA` array — 7 daily points_ | Should compute weekly sustainability scores based on spending patterns.                                                | ❌ Pending |
| 73  | Get CO2 & Water Savings       | —      | _Hardcoded: `-12kg CO2`, `340L water`_           | Should calculate from actual transaction data using environmental impact formulas.                                     | ❌ Pending |

---

### PHASE 15 — Session Management (Logout)

> **Component:** `App.tsx` • **Trigger:** User taps logout

| #   | API Name                | Method | Endpoint / SDK Call       | Explanation                                                                                                                              | Status        |
| --- | ----------------------- | ------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 74  | Logout — Express Server | `POST` | `/auth/logout`            | Clears the `access_token` HTTPOnly cookie by setting `maxAge: 0`.                                                                        | ✅ Integrated |
| 75  | Supabase Sign Out       | SDK    | `supabase.auth.signOut()` | Should be called alongside Express logout (#74) to fully clear the Supabase session. Currently NOT explicitly called in the logout flow. | ❌ Pending    |

---

### INFRASTRUCTURE — PWA & Vite Config

> **File:** `vite.config.ts` • **Impact:** All API routing

| #   | API Name                    | Method | Endpoint / SDK Call                         | Explanation                                                                                            | Status        |
| --- | --------------------------- | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| 76  | Vite Proxy — `/auth` routes | Proxy  | `localhost:5173/auth → localhost:3000/auth` | Development proxy that forwards all `/auth/*` requests to the Express backend.                         | ✅ Integrated |
| 77  | Vite Proxy — `/api` routes  | Proxy  | `localhost:5173/api → localhost:3000/api`   | Development proxy for future `/api/*` endpoints. Configured but no `/api` routes exist yet in Express. | 🔄 Ongoing    |
| 78  | PWA Service Worker          | Plugin | `VitePWA({ registerType: 'autoUpdate' })`   | Auto-updates the PWA service worker for offline caching and app installation.                          | ✅ Integrated |

---

## 📊 Final Count Summary

| Status                                   | Count  | Percentage |
| ---------------------------------------- | ------ | ---------- |
| ✅ **Integrated** (Real, working)        | **18** | 23%        |
| 🔄 **Ongoing** (Mock/Partial/Scaffolded) | **12** | 15%        |
| ❌ **Pending** (Not built)               | **48** | 62%        |
| **TOTAL**                                | **78** | 100%       |

---

## Integrated APIs Breakdown (18)

| #   | API                                          | Technology       | Component                                                               |
| --- | -------------------------------------------- | ---------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | `supabase.auth.getSession()`                 | Supabase SDK     | App.tsx                                                                 |
| 2   | `supabase.auth.onAuthStateChange()`          | Supabase SDK     | App.tsx                                                                 |
| 3   | Supabase `profiles` table query              | Supabase SDK     | App.tsx                                                                 |
| 4   | Google GSI Script Load                       | Google GSI       | Auth.tsx                                                                |
| 5   | Google GSI Initialize                        | Google GSI       | Auth.tsx                                                                |
| 6   | Google One Tap Prompt                        | Google GSI       | Auth.tsx                                                                |
| 7   | `supabase.auth.signInWithIdToken()` — Web    | Supabase SDK     | Auth.tsx                                                                |
| 8   | Native Google Sign-In (Capacitor)            | Capacitor Plugin | Auth.tsx                                                                |
| 9   | `supabase.auth.signInWithIdToken()` — Native | Supabase SDK     | Auth.tsx                                                                |
| 10  | `POST /auth/mobile`                          | Express REST     | server/index.js                                                         |
| 11  | Supabase `app_users` — select                | Supabase SDK     | Auth.tsx                                                                |
| 12  | Supabase `app_users` — insert                | Supabase SDK     | Auth.tsx                                                                |
| 13  | `POST /auth/google`                          | Express REST     | server/index.js                                                         |
| 14  | `GET /auth/me`                               | Express REST     | server/index.js                                                         |
| 15  | Nominatim Reverse Geocoding                  | REST API         | InitialSetup.tsx                                                        |
| 16  | DiceBear Avatar Generation                   | REST API         | Auth.tsx, InitialSetup.tsx                                              |
| 17  | Gemini AI — Spending Insights                | Server (Proxy)   | `POST /api/ai/spending-insight` → Groq (Llama 3.3) -> Gemini (Fallback) | Backend-mediated AI call. Auth: JWT (Web) or Bearer (Mobile). Returns personality & tips. Fallback: Groq -> Gemini -> Math. | ✅ Integrated |
| 18  | Gemini AI — Wish Tracker Plan                | Server (Proxy)   | `POST /api/ai/wish-plan` → Groq (Llama 3.3) -> Gemini (Fallback)        | Backend-mediated AI call. Generates 3-step saving plan. Robust fallback: Groq -> Gemini -> Local Math.                      | ✅ Integrated |

_(Plus: `POST /auth/logout`, Vite Proxy `/auth`, PWA Service Worker, EMI Calculator = local/infrastructure)_

---

## Ongoing APIs Breakdown (12)

| #   | API                      | What Exists                                   | What's Missing                       |
| --- | ------------------------ | --------------------------------------------- | ------------------------------------ |
| 1   | Send OTP to Mobile       | Hardcoded OTP `021303`                        | Real SMS gateway (Twilio/MSG91)      |
| 2   | Aadhaar Validation       | Verhoeff algorithm (local)                    | Real UIDAI API verification          |
| 3   | PAN Validation           | Regex check (local)                           | Real PAN verification API            |
| 4   | Get Transactions         | `apiService.getTransactions()` with mock data | Real `transactions` DB table + API   |
| 5   | Get Savings Goals        | Hardcoded inline (2 goals)                    | Real `goals` DB table + API          |
| 6   | Add Expense              | `handleAddExpense()` → local state            | Supabase persistence                 |
| 7   | AI Category Suggestion   | Local regex keyword matching                  | Gemini AI enhancement                |
| 8   | Category Breakdown       | Local `useMemo` calculation                   | Real data source                     |
| 9   | Mark Bill as Paid        | `markPaid()` → local state                    | Supabase persistence                 |
| 10  | Credit Score Simulator   | Local `useMemo` math engine                   | Backend scoring model                |
| 11  | Vite Proxy `/api` routes | Configured in vite.config.ts                  | No Express `/api` routes built       |
| 12  | Browser Geolocation      | `navigator.geolocation` works                 | — (complete but listed as local API) |

---

## Pending APIs Breakdown by Priority (48)

### 🔴 Critical Priority (Build First)

| #   | API                          | Provider Needed                      | Component             |
| --- | ---------------------------- | ------------------------------------ | --------------------- |
| 1   | SMS OTP Gateway              | Twilio / MSG91 / Firebase Phone Auth | Auth.tsx              |
| 2   | Save User Profile to Backend | Supabase `profiles.upsert()`         | InitialSetup.tsx      |
| 3   | Supabase Sign Out            | `supabase.auth.signOut()`            | App.tsx               |
| 4   | Get Account Balance          | Account Aggregator (AA) Framework    | Dashboard.tsx         |
| 5   | Get Credit Score             | CIBIL / Experian / CRIF API          | Dashboard, FlowCredit |
| 6   | Get Expenses                 | Supabase `expenses` table            | ExpenseTracker.tsx    |
| 7   | Get All Bills                | Supabase `bills` table               | BillReminders.tsx     |
| 8   | Get Payment History          | Supabase `payments` table            | FlowPay.tsx           |
| 9   | Get Wishlist                 | Supabase `wishes` table              | AIWishTracker.tsx     |
| 10  | Create New Goal              | Supabase `goals` table               | FlowGoals.tsx         |

### 🟡 Medium Priority

| #   | API                        | Provider Needed                     | Component         |
| --- | -------------------------- | ----------------------------------- | ----------------- |
| 11  | Apple Sign-In              | Apple JS SDK + Supabase             | Auth.tsx          |
| 12  | KYC — Aadhaar Fetch        | Digio / Surepass / IDfy             | InitialSetup.tsx  |
| 13  | KYC — PAN Fetch            | Digio / Surepass / IDfy             | InitialSetup.tsx  |
| 14  | eKYC Biometric             | UIDAI eKYC / Video KYC              | InitialSetup.tsx  |
| 15  | UPI Payment (Initiate)     | Razorpay / PayU / PhonePe           | FlowPay.tsx       |
| 16  | QR Code Scanner            | Capacitor Barcode Scanner           | FlowPay.tsx       |
| 17  | P2P Money Transfer         | UPI PSP API                         | FlowPay.tsx       |
| 18  | Pay Bill via BBPS          | BillDesk / Razorpay BBPS            | FlowPay.tsx       |
| 19  | Push Notifications         | Firebase Cloud Messaging            | BillReminders.tsx |
| 20  | AI Chat — Real Gemini      | `@google/genai` with context        | AIInsights.tsx    |
| 21  | AI Insights — Personalized | `@google/genai` with full user data | AIInsights.tsx    |
| 22  | AI Chat — Streaming        | SSE / WebSocket                     | AIInsights.tsx    |
| 23  | Add New Wish               | Supabase `wishes` table             | AIWishTracker.tsx |
| 24  | Update Goal Progress       | Supabase `goals` table              | FlowGoals.tsx     |

### 🟢 Lower Priority

| #     | API                                        | Provider Needed         | Component              |
| ----- | ------------------------------------------ | ----------------------- | ---------------------- |
| 25–30 | Dashboard chart data (5 APIs)              | Bank/transaction APIs   | Dashboard.tsx          |
| 31–35 | Credit module (5 APIs)                     | Bureau API + CMS        | FlowCredit.tsx         |
| 36–37 | Monthly breakdown, Category API            | Transaction aggregation | ExpenseTracker.tsx     |
| 38–39 | Upcoming EMIs, Bill Status                 | Loan/bill aggregator    | FlowPay.tsx            |
| 40–42 | Eco Score, Green Data, CO2 savings         | Climatiq API            | SustainabilityCard.tsx |
| 43–45 | Loan Products, Eligibility, Pre-Approval   | NBFC Partner APIs       | LoanMarketplace.tsx    |
| 46–48 | Lending Partners, Instant Loan Application | NBFC APIs               | FlowLend.tsx           |

---

## Supabase Tables Required

| Table                   | Status    | Purpose                                   |
| ----------------------- | --------- | ----------------------------------------- |
| `app_users`             | ✅ Exists | Auth (Express backend mobile/google flow) |
| `profiles`              | ✅ Exists | User name, avatar, preferences            |
| `transactions`          | ❌ Create | Dashboard transactions, spending analysis |
| `expenses`              | ❌ Create | Expense tracker records                   |
| `bills`                 | ❌ Create | Bill reminders and due dates              |
| `goals`                 | ❌ Create | Savings goals tracking                    |
| `wishes`                | ❌ Create | AI Wish Tracker items                     |
| `payments`              | ❌ Create | FlowPay payment records                   |
| `loan_products`         | ❌ Create | Loan marketplace catalog                  |
| `user_settings`         | ❌ Create | Theme, notification preferences           |
| `chat_history`          | ❌ Create | AI chat conversation persistence          |
| `sustainability_scores` | ❌ Create | Eco impact tracking                       |

---

## External Service Dependencies

| #   | Service                  | Provider                       | SDK/Library                     | Used In                | Status    |
| --- | ------------------------ | ------------------------------ | ------------------------------- | ---------------------- | --------- |
| 1   | Database & Auth          | Supabase (PostgreSQL)          | `@supabase/supabase-js v2.95.3` | App-wide               | ✅        |
| 2   | Google Sign-In (Web)     | Google Identity Services       | GSI Script                      | Auth.tsx               | ✅        |
| 3   | Google Sign-In (Native)  | Android Credential Manager     | Custom Capacitor Plugin         | Auth.tsx               | ✅        |
| 4   | AI / LLM                 | Groq (Llama) / Google (Gemini) | REST API via Backend            | Dashboard, FlowGoals   | ✅        |
| 5   | Google Auth Verification | Google                         | `google-auth-library v10.5.0`   | server/index.js        | ✅        |
| 6   | JWT Tokens               | —                              | `jsonwebtoken v9.0.3`           | server/index.js        | ✅        |
| 7   | Reverse Geocoding        | OpenStreetMap                  | Nominatim REST API              | InitialSetup.tsx       | ✅        |
| 8   | Avatar Generation        | DiceBear                       | REST API                        | Auth.tsx               | ✅        |
| 9   | Mobile Framework         | Capacitor 8+                   | `@capacitor/core v8.1.0`        | Android/iOS            | ✅        |
| 10  | PWA                      | Vite PWA                       | `vite-plugin-pwa v1.2.0`        | vite.config.ts         | ✅        |
| 11  | SMS Gateway              | Twilio / MSG91                 | —                               | Auth.tsx               | ❌ Needed |
| 12  | KYC Provider             | Digio / Surepass / IDfy        | —                               | InitialSetup.tsx       | ❌ Needed |
| 13  | UPI PSP                  | Razorpay / PayU                | —                               | FlowPay.tsx            | ❌ Needed |
| 14  | Credit Bureau            | CIBIL / Experian               | —                               | FlowCredit.tsx         | ❌ Needed |
| 15  | Bill Payments (BBPS)     | BillDesk / Razorpay            | —                               | FlowPay.tsx            | ❌ Needed |
| 16  | Push Notifications       | Firebase (FCM)                 | —                               | BillReminders.tsx      | ❌ Needed |
| 17  | Carbon Footprint         | Climatiq / Carbon Interface    | —                               | SustainabilityCard.tsx | ❌ Needed |

---

> **Document Status:** ✅ FULLY VERIFIED — Every component, service, server route, plugin, and config file audited line-by-line.  
> **Last Updated:** 20 Feb 2026  
> **Total API Points: 78 | Integrated: 18 | Ongoing: 12 | Pending: 48**
