# FlowMint Knowledgebase & Design System

## 1. Design Philosophy

FlowMint adopts a **"Cyber-Finance"** aesthetic.

- **Core Theme:** Dark mode first, high contrast neon accents ("Brand Green/Mint").
- **Material:** Glassmorphism (blur effects) to create depth and hierarchy.
- **Motion:** Fluid animations using `framer-motion` to make the app feel "alive".
- **Typography:** Modern sans-serif (Inter/System Stack) for readability and trust.

### Color Palette (CSS Variables)

- `--brand-primary`: The core "Mint" color. Used for primary actions, success states, and branding.
- `--bg-color`: Deep black/charcoal backgrounds.
- `--glass-border`: Semi-transparent white for glass card edges.
- `--text-color`: High contrast white/off-white.

## 2. Component Library (Key Modules)

### Dashboard (`Dashboard.tsx`)

- **Purpose:** The landing page.
- **Widgets:**
  - **Balance Card:** Shows total liquidity.
  - **Spending Chart:** `recharts` AreaChart for visual trend analysis.
  - **Sustainability Card:** A unique component linking finance to eco-impact.
- **Data Flow:** Receives `userProfile` prop; manages local state for visible widgets.

### AI Integration (`geminiService.ts`)

- **Pattern:** Stateless service functions.
- **Instantiation:** `GoogleGenAI` client is instantiated _inside_ each function call to ensure the latest API key is used (crucial for environment variable updates).
- **Prompt Engineering:**
  - **Persona:** "Witty financial genius for Indian Millennials".
  - **Tone:** "No cap, bet, flex" - casual but smart.
  - **Models:** `gemini-3-flash-preview` for quick tips, `gemini-3-pro-preview` for complex planning.

### Authentication (`Auth.tsx`)

- **Current State:** Simulated authentication.
- **Flow:** Login -> `handleLoginSuccess` -> Sets `isAuthenticated` state in `App.tsx`.
- **Future:** Needs integration with a backend (Supabase/Firebase) for JWT handling.

## 3. Common Patterns & Best Practices

### Theming

- The app uses a CSS class-based theme switcher.
- `document.body.classList.add('light')` toggles the light mode overrides defined in `index.css`.
- All colors should use CSS variables (e.g., `var(--bg-color)`) instead of hardcoded hex values to support instant theming.

### Error Handling

- **ErrorBoundary (`ErrorBoundary.tsx`):** Wraps critical components to prevent the white screen of death.
- **Usage:** Used in `App.tsx` around `Auth` and the main content router.
- **Fallback:** Displays a friendly error message and a "Retry" button.

### Navigation

- **State:** Controlled by `activeTab` state in `App.tsx`.
- **Component:** Custom bottom navigation bar with floating action button (FAB) for "Add" actions.
- **Animation:** `AnimatePresence` handles the cross-dissolve/slide effect between tabs.

## 4. Troubleshooting

### "Module not found"

- Ensure all new files are `.tsx` (React) or `.ts`.
- Check `tsconfig.json` if using path aliases (currently using relative paths).

### White Screen on Mobile

- Running `npx cap open android` without building first? -> Run `npm run build && npx cap sync`.
- Check Logcat in Android Studio for JS errors.
