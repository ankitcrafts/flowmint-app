# ══════════════════════════════════════════════════════════════

# FlowMint Backend — Deployment Guide

# ══════════════════════════════════════════════════════════════

#

# Your Express backend needs to be deployed so both the web app

# and the Capacitor APK can reach it from anywhere.

#

# ────────────────────────────────────────────────────────────

# OPTION 1: Render.com (Recommended — Free Tier)

# ────────────────────────────────────────────────────────────

#

# 1. Go to https://render.com and sign in with GitHub

#

# 2. Click "New +" → "Web Service"

#

# 3. Connect your GitHub repo: ankitcrafts/flowmint-app

#

# 4. Configure:

# - Name: flowmint-server

# - Root Directory: server

# - Runtime: Node

# - Build Command: npm install

# - Start Command: npm start

# - Instance Type: Free

#

# 5. Add Environment Variables (Settings → Environment):

#

# SUPABASE_URL = https://qefuzyxzgcrnpllkrznd.supabase.co

# SUPABASE_SERVICE_ROLE_KEY = (your service role key)

# GOOGLE_CLIENT_ID = 67326297377-our22c4hei4djsjv0v4piilbpe53a3e0.apps.googleusercontent.com

# JWT_SECRET = (Your Supabase JWT Secret — MUST match dashboard)

# Found in: Project Settings → API → JWT Settings → JWT Secret

# GROQ_API_KEY = (your Groq API key)

# GEMINI_API_KEY = (your Gemini key, or leave empty)

# NODE_ENV = production

# FRONTEND_URL = https://flowmint.vercel.app (or your web URL)

#

# 6. Click "Create Web Service" — Render will deploy automatically

#

# 7. Your server URL will be: https://flowmint-server.onrender.com

# (This is already configured in utils/platform.ts)

#

# ────────────────────────────────────────────────────────────

# OPTION 2: Railway.app (Alternative — $5 Free Credit)

# ────────────────────────────────────────────────────────────

#

# 1. Go to https://railway.app and sign in with GitHub

#

# 2. Click "New Project" → "Deploy from GitHub Repo"

#

# 3. Select your repo: ankitcrafts/flowmint-app

#

# 4. Configure:

# - Root Directory: server

# - Start Command: npm start

#

# 5. Add the same environment variables as above

#

# 6. Railway will auto-assign a URL like:

# https://flowmint-server-production.up.railway.app

#

# 7. Update VITE_API_SERVER_URL in your .env.local to match

#

# ────────────────────────────────────────────────────────────

# After Deployment — Update Frontend Config

# ────────────────────────────────────────────────────────────

#

# Once deployed, the Capacitor APK uses the URL from:

# utils/platform.ts → getApiBase()

#

# The default fallback is: https://flowmint-server.onrender.com

#

# To customize, add to your .env.local:

# VITE_API_SERVER_URL=https://your-custom-server-url.com

#

# Then rebuild the APK:

# npm run build

# npx cap sync android

# cd android && .\gradlew.bat assembleDebug

#

# ════════════════════════════════════════════════════════════
