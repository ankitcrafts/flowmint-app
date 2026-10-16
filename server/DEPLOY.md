cbt-agentic-clinical-intelligence-assistant-backend# ══════════════════════════════════════════════════════════════

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

# SUPABASE_URL = https://your-project.supabase.co

# SUPABASE_SERVICE_ROLE_KEY = (your service role key)
#
# SMTP_HOST = (your SMTP host, e.g. smtp.gmail.com)
# SMTP_PORT = (465 for SSL or 587 for STARTTLS)
# SMTP_SECURE = (true for port 465, otherwise false)
# SMTP_USER = (SMTP account username)
# SMTP_PASSWORD = (SMTP provider password or app password)
# SMTP_FROM = (verified sender, e.g. FlowMint <you@example.com>)
# OTP_HASH_SECRET = (optional random server-only secret; defaults to service role key)

# Legacy Google sign-in is not used by the active V1 app.

# Supabase Auth verifies the Supabase access token; a legacy JWT_SECRET is not required.

# GROQ_API_KEY = (your Groq API key)

# GEMINI_API_KEY = (optional server-only Gemini key)

# NODE_ENV = production

# FRONTEND_URL = https://flowmint.vercel.app (or your web URL)

#

# 6. Click "Create Web Service" — Render will deploy automatically
#
# 7. Apply supabase/migrations/006_email_login_otp.sql in the Supabase SQL Editor.

#

# 8. Your server URL will be: https://flowmint-server.onrender.com

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
# 6. Apply supabase/migrations/006_email_login_otp.sql in the Supabase SQL Editor

#

# 7. Railway will auto-assign a URL like:

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
