# FlowMint - Financial Super App: Product Requirements Document (PRD)

## 1. Executive Summary

**Product Name:** FlowMint
**Vision:** To become the ultimate "Financial Super App" for Indian Gen-Z and Millennials, blending traditional finance with modern lifestyle, sustainability, and AI-driven insights. FlowMint makes money management cool, intuitive, and rewarding.
**Target Audience:** Digital-native Indians (Age 18-35), financially conscious but overwhelmed by traditional banking apps.

## 2. Core Value Proposition

- **Unified Financial View:** Dashboard aggregating spending, credit, and goals.
- **AI-Powered Genius:** FlowMint AI (powered by Gemini) acts as a witty, culturally relevant financial advisor.
- **Sustainability Focus:** Tracking the carbon footprint of spending, aligning financial health with planetary health.
- **Gamified Growth:** Credit building and savings are turned into engaging challenges with rewards.

## 3. Product Pillars & Features

### 3.1. Dashboard (The Command Center)

- **Overview:** High-level view of Total Balance, Monthly Spend, and Credit Score.
- **Visuals:** Glassmorphic cards, neon accents, charts powered by `recharts`.
- **Quick Actions:** Scan & Pay, Add Money, Check Score.
- **Sustainability:** Real-time eco-impact score based on transaction categories.

### 3.2. FlowPay (Payments)

- UPI-style payment integration simulation.
- P2P transfers.
- Bill payments and subscriptions management.

### 3.3. FlowCredit (Credit Health)

- Credit Score visualization (Guage/Meter).
- Credit builder tips driven by AI.
- Loan eligibility checker.

### 3.4. FlowGoals (Smart Savings)

- **Wish Tracker:** Users define a goal (e.g., "Bali Trip", "iPhone 16").
- **AI Plan:** FlowMint AI generates a step-by-step saving plan based on income and spending habits.
- **Auto-Save:** Rules to roundup spare change or save daily.

### 3.5. FlowLend (Lending - Future Phase)

- Micro-loans for short-term needs.
- P2P lending marketplace (Peer-to-Peer).

### 3.6. FlowMint AI (The Brain)

- **Persona:** Witty, Gen-Z lingo ("No cap", "Bet"), direct and actionable advice.
- **Tech:** Google Gemini Flash & Pro models.
- **Capabilities:**
  - "Spend Personality" analysis.
  - "Alpha Tips" for wealth creation.
  - Budgeting hacks custom to Indian user context.

## 4. Technical Architecture

- **Frontend:** React 19 (TypeScript) + Vite.
- **Backend:** Node.js + Express.js (Middleware for Auth & Logic).
- **Database:** Supabase (PostgreSQL) for user data.
- **Styling:** Tailwind CSS v4 + Framer Motion (Animations).
- **Mobile:** Capacitor 8+ (Android/iOS wrapper).
- **AI:** Google GenAI SDK (Gemini 1.5/2.0).
- **State Management:** React Hooks / Context.
- **Authentication:** Hybrid (Google OAuth + Mobile OTP) via HttpOnly Cookies.

## 5. Roadmap

### Phase 1: MVP (Current Status)

- [x] UI/UX Foundation (Glassmorphism, Dark/Light Mode).
- [x] Basic Dashboard & Navigation.
- [x] AI Integration (Gemini Service connected).
- [x] Mock Data for demonstration (Transactions, Loans).
- [x] Component structure (FlowPay, FlowGoals, etc.).
- [x] **Secure Authentication:** Google Sign-In & Mobile OTP flow implemented.
- [x] **Backend Layer:** Express server with Supabase connection.

### Phase 2: "Addups" (Next Features)

- [ ] **Real Data Integration:** Connect with Account Aggregator (AA) framework for real bank transactions.
- [ ] **Enhanced AI Chat:** Dedicated chat interface for financial queries.
- [ ] **Gamification Engine:** Points system, badges ("Saver", "Investor"), and leaderboards.
- [ ] **Sustainability Metrics:** API integration for real carbon footprint data per merchant category.

### Phase 3: Production Readiness

- [ ] **Security Audit:** OWASP Top 10 check for financial data.
- [ ] **Performance Optimization:** Code splitting, lazy loading components.
- [ ] **Store Deployment:** Google Play Store & Apple App Store submission via Capacitor.
- [ ] **Monetization:** Premium tier ("FlowMint Black") offering lower fees, higher rewards, and advanced AI.

## 6. Success Metrics

- **DAU/MAU:** Daily/Monthly Active Users.
- **Retention:** D30 Retention Rate.
- **Financial Health:** Average increase in user credit score after 6 months.
- **AI Engagement:** Number of queries/insights generated per user.
