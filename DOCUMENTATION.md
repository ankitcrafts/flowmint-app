# FlowMint Documentation

## 1. Project Overview

**FlowMint** is a modern, cross-platform financial super app built with the latest web technologies. It allows users to manage payments, credit, savings, and sustainability goals in a unified, gamified interface. The app is optimized for mobile (Android/iOS) via Capacitor but runs perfectly as a responsive PWA.

## 2. Technology Stack

### Core Frameworks

- **Runtime:** Node.js
- **Language:** TypeScript
- **Build Tool:** Vite (High-performance bundler)
- **UI Framework:** React 19
- **Mobile Engine:** Capacitor 6+ (Web-to-Native bridge)

### UI & Styling

- **Styling:** Tailwind CSS v4 (Utility-first CSS)
- **Animations:** Framer Motion (Complex interactions and transitions)
- **Icons:** Lucide React
- **Charts:** Recharts (Responsive charts for financial data)

### AI & Services

- **AI Provider:** Google Generative AI (Gemini)
- **SDK:** `@google/genai`
- **Models:** `gemini-3-flash-preview` (Speed/Chat), `gemini-3-pro-preview` (Complex planning)

## 3. Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Android Studio (for Android build) / Xcode (for iOS build)

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
    Create a `.env.local` file in the root directory and add your Google Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

### Running Locally (Web)

Start the development server:

```bash
npm run dev
```

Access the app at `http://localhost:5173`.

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
├── services/           # Service layer
│   ├── geminiService.ts # AI Integration logic
├── android/            # Native Android project files
├── dist/               # Production build output
├── public/             # Static assets
├── App.tsx             # Main Application Component & Routing
├── index.css           # Global styles and Tailwind imports
└── package.json        # Dependencies and scripts
```

## 5. Deployment Guide

### Web (PWA/Vercel/Netlify)

Since this is a Vite app, it can be deployed to any static host.

1.  Run `npm run build`.
2.  Deploy the `dist` folder.

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

Located in `index.css` (Tailwind v4 uses CSS-first configuration). Custom theme variables like `--brand-primary`, `--bg-color` are defined in `:root` and mapped to Tailwind utilities if needed.

### Capacitor

Located in `capacitor.config.ts`. Controls app ID (`appId`), app name (`appName`), and web directory (`webDir: 'dist'`).
