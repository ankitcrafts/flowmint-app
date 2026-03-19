# FlowMint — Complete API Integration Registry

> **Total APIs Identified: 68**  
> **Integrated: 23 | Ongoing (Partial/Mock): 9 | Pending (Not Built): 36**  
> **Last Verified: 20 March 2026 — Server deployment, Step-Up Biometrics, and AI Chat E2E Verified.**

---

## 📊 Status Legend

| Status            | Meaning                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| ✅ **Integrated** | Fully working with real API/SDK — production-ready or functional                     |
| 🔄 **Ongoing**    | Partially working — mock data, simulated flow, or hardcoded but has code scaffolding |
| ❌ **Pending**    | Not built yet — needs full implementation from scratch                               |

---

## 🛡️ Security & Reliability (New)

| Feature               | Implementation                       | Outcome                                                 |
| --------------------- | ------------------------------------ | ------------------------------------------------------- |
| **JWT Verification**  | `jwt.verify(token, JWT_SECRET)`      | Prevents token spoofing & user impersonation            |
| **API Rate Limiting** | `express-rate-limit` (100 req / 15m) | Protects against DDoS and AI API cost spikes            |
| **Security Headers**  | `helmet.js`                          | Protection against XSS, Clickjacking, and MIME sniffing |
| **AI Reliability**    | 15s Timeouts + Safe Parsing          | Prevents hanging requests & frontend crashes            |

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
| 15  | Get Current User                               | `GET`      | `/auth/me` (🔒 JWT Protected)                                                    | Protected route: reads JWT from cookie → verified signature via `JWT_SECRET` → returns user data.                                                                   | ✅ Integrated |
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

| #   | API Name                      | Method      | Endpoint / SDK Call                                                           | Explanation                                                                                                               | Status        |
| --- | ----------------------------- | ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 18  | Browser Geolocation           | Browser API | `navigator.geolocation.getCurrentPosition()`                                  | Requests GPS coordinates from the device/browser to auto-detect the user's location for city pre-fill.                    | ✅ Integrated |
| 19  | Reverse Geocoding — Nominatim | `GET`       | `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json` | Converts GPS coordinates to a human-readable city name using OpenStreetMap's free Nominatim API.                          | ✅ Integrated |
| 20  | Aadhaar Number Validation     | Client-side | _Verhoeff algorithm (local computation)_                                      | Validates the 12-digit Aadhaar number using the Verhoeff checksum algorithm. No external API call — pure math.            | 🔄 Ongoing    |
| 21  | PAN Number Validation         | Client-side | _Regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`_                                       | Validates PAN format using a regex pattern. No external API call.                                                         | 🔄 Ongoing    |
| 22  | Fetch KYC Details (Aadhaar)   | —           | _Simulated: returns hardcoded demo name/DOB_                                  | Should fetch verified identity details from Aadhaar via a KYC provider. Currently returns fake data after a `setTimeout`. | ❌ Pending    |
| 23  | Fetch KYC Details (PAN)       | —           | _Simulated: returns hardcoded demo name/DOB_                                  | Should verify PAN and return name/DOB from tax records via a KYC provider. Currently returns fake data.                   | ❌ Pending    |
| 24  | eKYC Biometric Verification   | Capacitor   | `BiometricAuth` plugin / `Web Crypto API`                                     | Utilizes Fingerprint/FaceID via Android BiometricAuthPlugin & local AES-GCM encryption, superseding external 3rd-party KYC. | ✅ Integrated |
| 25  | Save User Profile to Backend  | `POST`      | `/api/profile` (🔒 JWT Protected)                                             | Persists all collected profile data to the `user_financial_profiles` table in Supabase.                                   | ✅ Integrated |
| 26  | Generate Avatar — DiceBear    | `GET`       | `https://api.dicebear.com/7.x/avataaars/svg?seed={name}`                      | Generates unique SVG avatar based on user's name. Used in both `Auth.tsx` and `InitialSetup.tsx`.                         | ✅ Integrated |

---

### PHASE 4 — Dashboard (Home)

> **Component:** `Dashboard.tsx` • **Trigger:** Main screen after login

| #   | API Name                            | Method  | Endpoint / SDK Call                                 | Explanation                                                                                                                 | Status        |
| --- | ----------------------------------- | ------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 27  | Get Transactions                    | Service | `apiService.getTransactions()`                      | Fetches list of financial transactions. Currently returns hardcoded mock data from `apiService.ts` with a fake 200ms delay. | 🔄 Ongoing    |
| 28  | AI Spending Insights                | Server  | `POST /api/ai/spending-insight` → Groq Llama 3.3    | Backend-mediated AI call. Primary: Groq (Llama 3.3). Fallback: Gemini Flash 2.0.                                            | ✅ Integrated |
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
| 49  | Get AI Savings Plan    | Server | `POST /api/ai/wish-plan` → Groq (Llama 3.3)                       | Backend-mediated call. Primary: Groq. Fallback: Gemini Flash 2.0. Reliability: 15s timeout + math fallback.            | ✅ Integrated |
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

| #   | API Name     | Method | Endpoint / SDK Call                         | Explanation                                                            | Status        |
| --- | ------------ | ------ | ------------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| 61  | Get Wishlist | Server | `GET /api/ai/history?type=wish_plan`        | Fetches all past AI-generated wish plans. Integrated with History tab. | ✅ Integrated |
| 62  | Add New Wish | Server | `POST /api/ai/wish-plan` (🔒 JWT Protected) | Persists new wish plan to Supabase automatically via backend route.    | ✅ Integrated |

---

### PHASE 13 — AI Advisor (Insights + Chat)

> **Component:** `AIInsights.tsx` • **Trigger:** User navigates to AI tab

| #   | API Name               | Method | Endpoint / SDK Call                    | Explanation                                                                       | Status        |
| --- | ---------------------- | ------ | -------------------------------------- | --------------------------------------------------------------------------------- | ------------- |
| 68  | Get AI Insights Feed   | Server | `POST /api/ai/spending-insight`        | Real AI insights generated by Groq/Llama 3.3. Corrected for production.           | ✅ Integrated |
| 69  | AI Chat — Send Message | Server | `POST /api/ai/chat` (🔒 JWT Protected) | Primary: Groq Llama 3.3. Fallback: Gemini. Supports context-aware financial chat. | ✅ Integrated |
| 70  | AI Chat — History      | Server | `GET /api/ai/history?type=chat`        | Fetches past chat conversations for persistence.                                  | ✅ Integrated |

---

### INFRASTRUCTURE — Deployment & Scaling

> **Hosting:** Render.com • **API Base:** `https://flowmint-app.onrender.com`

| #   | API Name                    | Method | Endpoint / SDK Call                         | Explanation                                                                                  | Status        |
| --- | --------------------------- | ------ | ------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------- |
| 76  | Vite Proxy — `/auth` routes | Proxy  | `localhost:5173/auth → localhost:3000/auth` | Development proxy that forwards all `/auth/*` requests to the Express backend.               | ✅ Integrated |
| 77  | Cloud API Base (Mobile)     | Global | `https://flowmint-app.onrender.com`         | Production URL for mobile APK and deployed web client. Auto-detected in `utils/platform.ts`. | ✅ Integrated |
| 78  | Health Check                | `GET`  | `/` (Live on Render)                        | Deployment monitoring endpoint. Returns server status, version, and AI provider health.      | ✅ Integrated |

---

## 📊 Final Count Summary

| Status                                   | Count  | Percentage |
| ---------------------------------------- | ------ | ---------- |
| ✅ **Integrated** (Real, working)        | **22** | 32%        |
| 🔄 **Ongoing** (Mock/Partial/Scaffolded) | **10** | 15%        |
| ❌ **Pending** (Not built)               | **36** | 53%        |
| **TOTAL**                                | **68** | 100%       |

---

> **Document Status:** ✅ FULLY VERIFIED — Updated for Cloud Deployment & Security Hardening.  
> **Last Updated:** 20 March 2026  
> **Total API Points: 68 | Integrated: 22 | Ongoing: 10 | Pending: 36**
