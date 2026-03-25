# 🚀 FlowMint — Production & Launch Readiness Audit

> **Audit Date:** 2026-03-24 (Updated: 2026-03-26)  
> **Scope:** Full codebase review — Server, Frontend, Database, Security, DevOps

---

## Executive Summary

FlowMint is a well-architected fintech app with a solid foundation: real Supabase backend, AI integration (Groq + Gemini), Capacitor mobile support, and a polished UI. However, **several critical and high-priority items must be resolved before production launch**. The issues span security, authentication, data integrity, and infrastructure.

---

## 🔴 CRITICAL — Must Fix Before Launch

### 1. Hardcoded OTP Bypass — Zero Real Phone Auth
**Files:** `Auth.tsx`, `server/index.js`

The OTP is **hardcoded to `021303`** on the frontend, and the server explicitly states *"OTP validation is effectively skipped"*. This means:
- **Anyone with a phone number can access any account**
- No SMS/OTP provider (Twilio, MSG91, etc.) is integrated
- The server's `/auth/mobile` endpoint trusts the call blindly

**Action Required:**
- Integrate a real SMS OTP provider (MSG91 for India, or Supabase Phone Auth)
- Validate OTP on the **server side**, not client side
- Implement OTP rate limiting and expiry (5 min TTL)

---

### 2. ~~Insecure JWT Secret~~ ✅ RESOLVED
**Fixed on 2026-03-25:** Complete JWT security overhaul applied.
- 512-bit secret, strict HS256 algorithm, 15-minute expiry, refresh tokens, and key rotation.

---

### 3. ~~API Keys Leaked in `.env.local` — Committed to Git~~ ✅ RESOLVED
**Verified on 2026-03-25:** `.env.local` was **never committed** to git history.
- `.gitignore` hardened and `AIzaSy` keys safely decoupled.

---

### 4. ~~`app_users` Table Has a Fully Permissive RLS Policy~~ ✅ RESOLVED
**Fixed on 2026-03-25:** The `old_backup_to_drop` policy has been dropped and properly scoped user policies applied.

---

### 5. ~~Five Tables Have RLS Enabled But NO Policies~~ ✅ RESOLVED
**Fixed on 2026-03-25:** Least privilege constraints applied to all missing tables.

---

### 6. ~~ContentSecurityPolicy Disabled~~ ✅ RESOLVED
**Fixed on 2026-03-26:** 
- Strict `helmet` configuration implemented, enforcing `'self'` with explicit whitelists for Google Auth, Supabase, Groq, Gemini, and Apify.

---

## 🟠 HIGH PRIORITY — Should Fix Before Launch

### 7. ~~Dashboard Uses Hardcoded Mock Data~~ ✅ RESOLVED
**Files:** `Dashboard.tsx`, `FlowCredit.tsx` (Completed on 2026-03-26)

All frontend components are now fully integrated with real Supabase API calls:
- **Credit Score**: Fully wired via Apify CIBIL Actor to `FlowCredit.tsx` and `Dashboard.tsx`.
- **EMI / Bills Data**: Replaced mock variables with live computations straight from `dashboardService.getSummary()`.
- **Wealth History / Daily Stats**: Daily chart logic now queries `transactionService.getDailySpending()` directly from Supabase, removing all mock arrays. 

---

### 8. FlowPay Uses 100% Hardcoded Mock Data
**File:** `FlowPay.tsx`

- Payment history is a static array
- EMI bills are hardcoded inline
- "Send Money" is simulated with `setTimeout` — no real payment processing

**Action Required:**
- Connect to real `paymentService.getAll()` and `billService.getAll()`

---

### 9. `apiService` Has Mock Data Fallbacks That HIDE Real Errors
**File:** `apiService.ts`

The backward-compatible `apiService` silently catches ALL errors and returns fake data.

**Action Required:**
- Remove mock data fallbacks entirely from production builds

---

### 10. Dual Auth System Creates User Identity Fragmentation

The app has **two separate user systems**: `auth.users` (Supabase) vs `app_users` (Express).

**Action Required:**
- Unify on **one auth system** (recommend Supabase Auth for everything)

---

### 11. Apple Login is a Hardcoded Mock
**File:** `Auth.tsx`

**Action Required:**
- Either implement real Apple Sign-In or **remove the Apple button entirely**.

---

### 12. Rate Limiting Too Aggressive for Real Users
**File:** `server/index.js`

Current limit of `100 requests / 15 mins`.

**Action Required:**
- Increase to 500-1000 requests/15min for general API

---

## 🟡 MEDIUM PRIORITY — Should Fix Soon After Launch

### 13. Gemini API Key Exposed Client-Side via Vite `define`
**Action Required:**
- Remove `define` entries in `vite.config.ts`. All AI calls should go through Express server.

---

### 14. No `dashboard_summary` View Data Population
**Action Required:** Implement seed data or show clear "no data yet" states.

---

### 15. Missing PWA Assets
**Action Required:** Generate proper PWA icons from FlowMint logo.

---

### 16. ~~Tailwind CDN Script in Production~~ ✅ RESOLVED
**Fixed on 2026-03-26:**
- CDN script and `importmap` completely removed from `index.html`. 
- Application now securely bundled via local Vite/PostCSS, reducing overhead by ~300KB and eliminating a major XSS attack vector.

---

### 17. Functions Have Mutable search_path
**Action Required:**
- Set `search_path = public` for PostgreSQL functions.

---

### 18. Leaked Password Protection Disabled in Supabase Auth
**Action Required:** Enable in Supabase Dashboard.

---

## 🔵 NICE TO HAVE — Post-Launch Improvements

### 19. Split Server Monolith
### 20. Add Automated Tests
### 21. Deploy Backend to Render/Railway
### 22. Add Error Monitoring
### 23. Add Database Backup Strategy

---

## Summary Checklist

| Priority | Item | Status |
|----------|------|--------|
| 🔴 CRITICAL | Real OTP/SMS integration | ❌ Not done |
| ✅ RESOLVED | Strong JWT secret | ✅ 512-bit secret |
| ✅ RESOLVED | Check & rotate leaked API keys | ✅ Secure |
| ✅ RESOLVED | Drop `old_backup_to_drop` policy | ✅ Secure |
| ✅ RESOLVED | Add RLS policies to 5 tables | ✅ Secure |
| ✅ RESOLVED | Enable CSP headers | ✅ Strict `helmet` config |
| ✅ RESOLVED | Connect Dashboard to real data | ✅ Wired to APIs |
| 🟠 HIGH | Connect FlowPay to real data | ❌ All hardcoded |
| 🟠 HIGH | Remove mock data fallbacks | ❌ Hiding errors |
| 🟠 HIGH | Unify auth systems | ❌ Fragmented |
| 🟠 HIGH | Implement or remove Apple login | ❌ Fake mock |
| 🟠 HIGH | Adjust rate limiting | ⚠️ Too aggressive |
| 🟡 MEDIUM | Remove Gemini key from client bundle | ❌ Exposed |
| 🟡 MEDIUM | Add real data / empty states | ❌ All zeros |
| 🟡 MEDIUM | Generate PWA icons | ❌ Missing |
| ✅ RESOLVED | Remove Tailwind CDN & importmap | ✅ Removed |
| 🟡 MEDIUM | Fix function search_path | ❌ Vulnerable |
| 🟡 MEDIUM | Enable leaked password protection | ❌ Disabled |

---

> [!IMPORTANT]
> **The 1 remaining critical item (Real OTP/SMS Auth) MUST be fixed BEFORE any public launch.**
