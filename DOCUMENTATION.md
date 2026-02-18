# FlowMint Documentation

## 1. Project Overview

**FlowMint** is a modern, cross-platform financial super app built with the latest web technologies. It allows users to manage payments, credit, savings, and sustainability goals in a unified, gamified interface. The app is optimized for mobile (Android/iOS) via Capacitor but runs perfectly as a responsive PWA.

## 2. Technology Stack

### Core Frameworks

- **Frontend Runtime:** Node.js (Vite environment)
- **Backend Runtime:** Node.js (Express Server)
- **Language:** TypeScript
- **Build Tool:** Vite (High-performance bundler)
- **UI Framework:** React 19
- **Mobile Engine:** Capacitor 8+ (Web-to-Native bridge)

### UI & Styling

- **Styling:** Tailwind CSS v4 (Utility-first CSS)
- **Animations:** Framer Motion (Complex interactions and transitions)
- **Icons:** Lucide React
- **Charts:** Recharts (Responsive charts for financial data)

### Backend & Data

- **API Server:** Express.js (Handling Auth & Business Logic)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Custom JWT (HttpOnly Cookies) + Google OAuth + Mobile OTP (Simulated)
- **ORM/Client:** Supabase JS Client

### AI & Services

- **AI Provider:** Google Generative AI (Gemini)
- **SDK:** `@google/genai`
- **Models:** `gemini-3-flash-preview` (Speed/Chat), `gemini-3-pro-preview` (Complex planning)

## 3. Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Android Studio (for Android build) / Xcode (for iOS build)
- Supabase Project (URL & Keys)
- Google Cloud Console Project (Client ID for OAuth)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd flowmint---financial-super-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Setup:**
    Create a `.env.local` file in the root directory with the following keys:

    ```env
    # App
    VITE_API_URL=http://localhost:3000

    # AI
    GEMINI_API_KEY=your_gemini_key

    # Supabase
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (Backend only)

    # Auth
    GOOGLE_CLIENT_ID=your_google_client_id
    JWT_SECRET=your_jwt_secret
    ```

### Running Locally (Full Stack)

Start the development server (This runs both the Express Backend and Vite Frontend concurrently):

```bash
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

### Running on Mobile (Android)

1.  **Build the web assets:**
    ```bash
    npm run build
    ```
2.  **Sync with Capacitor:**
    ```bash
    npx cap sync
    ```
3.  **Open in Android Studio:**
    ```bash
    npx cap open android
    ```
    From Android Studio, run the app on an emulator or connected device.

### Running on Mobile (iOS) - _macOS Only_

1.  **Build the web assets:**
    ```bash
    npm run build
    ```
2.  **Sync with Capacitor:**
    ```bash
    npx cap sync
    ```
3.  **Open in Xcode:**
    ```bash
    npx cap open ios
    ```
    From Xcode, select your target simulator or device and click the Run button.

## 4. Directory Structure

```
flowmint---financial-super-app/
├── components/         # Reusable React components (UI blocks)
│   ├── Dashboard.tsx   # Main user dashboard
│   ├── FlowGoals.tsx   # Goals feature
│   ├── ...
├── services/           # Frontend Service layer
│   ├── geminiService.ts # AI Integration logic
│   ├── apiService.ts   # Mock Data / API calls
│   ├── supabase.ts     # Client-side Supabase instance
├── server/             # Backend Node.js/Express Server
│   ├── index.js        # Server entry point (Auth & API Routes)
├── android/            # Native Android project files
├── dist/               # Production build output
├── public/             # Static assets
├── App.tsx             # Main Application Component & Routing
├── index.css           # Global styles and Tailwind imports
└── package.json        # Dependencies and scripts
```

## 5. Deployment Guide

### Web (Full Stack)

Since the app now includes a Backend Server (`server/index.js`), it cannot be deployed to static hosts like Vercel (unless using Vercel Serverless functions, but the current setup is a long-running Node server).

**Recommended Hosts:** Render, Railway, Heroku, or a VPS.

1.  Build the frontend: `npm run build`.
2.  Configure the server to serve the `dist` folder static files (or host frontend separately).
3.  Start the server: `npm run server`.

### Android Play Store

1.  Open the Android project: `npx cap open android`.
2.  Update `versionCode` and `versionName` in `build.gradle`.
3.  Generate a Signed Bundle using Android Studio ("Build" -> "Generate Signed Bundle/APK").
4.  Upload the `.aab` file to Google Play Console.

### iOS App Store

1.  Open the iOS project: `npx cap open ios`.
2.  Update `Version` and `Build` numbers in the General settings tab.
3.  Select "Any iOS Device (arm64)" as the build target.
4.  Go to "Product" -> "Archive".
5.  Once archived, use the "Distribute App" flow to upload to App Store Connect.

## 6. Configuration

### Tailwind CSS

Located in `index.css` (Tailwind v4 uses CSS-first configuration). Custom theme variables like `--brand-primary`, `--bg-color` are defined in `:root`.

### Capacitor

Located in `capacitor.config.ts`. Controls app ID (`appId`), app name (`appName`), and web directory (`webDir: 'dist'`).

### Authentication Flow

1. **Google:** Frontend gets ID Token -> Backend validates -> Checks DB -> Returns Cookie.
2. **Mobile:** Frontend validates OTP -> Backend checks DB -> Returns Cookie.
