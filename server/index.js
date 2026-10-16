import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createEmailOtpRouter } from './emailOtp.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine env file based on environment
// In production (Render/Railway), env vars are set in dashboard — dotenv is a no-op
// In local dev, load from parent directory's .env.local
const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? '../.env.production' : '../.env.local');
dotenv.config({ path: envPath });
// Also load default .env as fallback (parent dir, then server dir)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Tell Express it is running behind a proxy (like Render)
// This fixes the express-rate-limit 'X-Forwarded-For' validation error by allowing it to use proxy headers for IP tracking.
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (Capacitor WebView, server-to-server, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:5173',
      'capacitor://localhost',       // Capacitor Android
      'ionic://localhost',           // Ionic WebView
      'https://localhost',           // Capacitor iOS
      'http://localhost:8100',       // Ionic dev server
    ];
    
    // Allow all capacitor:// and ionic:// schemes
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// 🛡️ Security Headers (XSS, Clickjacking, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other domains
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://accounts.google.com", 
        "https://cdn.tailwindcss.com" // Used in development/index.html
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://picsum.photos", 
        "https://api.dicebear.com", 
        "https://lh3.googleusercontent.com" // Google Avatar
      ],
      connectSrc: [
        "'self'", 
        "https://qefuzyxzgcrnpllkrznd.supabase.co", 
        "https://api.apify.com"
      ],
      frameSrc: ["'self'", "https://accounts.google.com"],
      upgradeInsecureRequests: [], // Force HTTPS
    },
  },
}));

// 🚦 Global Rate Limiter (Prevents DDoS/Brute Force)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter); // Apply only to API routes

// Health check — required by Render/Railway to verify server is alive
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FlowMint API',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    providers: {
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('PLACEHOLDER')),
    },
  });
});

// Initialize Supabase Client (Service Role)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Allow VITE prefix fallback for hybrid dev
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
app.use('/auth/email-otp', createEmailOtpRouter(supabase));

// Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Legacy JWT handlers are disabled; Supabase Auth is the sole identity provider.
const JWT_SECRET = process.env.JWT_SECRET;

// Optional: Previous secret for zero-downtime key rotation
// Set JWT_SECRET_PREVIOUS to the old key when rotating, remove it after all old tokens expire
const JWT_SECRET_PREVIOUS = process.env.JWT_SECRET_PREVIOUS || null;

// Strict JWT signing/verification options
const JWT_SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'flowmint-server',
  audience: 'flowmint-app',
  expiresIn: '15m', // Short-lived access tokens (15 minutes)
};
const JWT_VERIFY_OPTIONS = {
  algorithms: ['HS256'],
  issuer: 'flowmint-server',
  audience: 'flowmint-app',
};
const JWT_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 minutes (matches token expiry)
const REFRESH_TOKEN_EXPIRY = '7d'; // Long-lived refresh tokens
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Token monitoring counters (reset every hour)
let tokenMonitor = { invalid: 0, expired: 0, rotated: 0, lastReset: Date.now() };
setInterval(() => {
  if (tokenMonitor.invalid > 0 || tokenMonitor.expired > 0) {
    console.warn(`🔐 JWT Monitor (last hour): ${tokenMonitor.invalid} invalid, ${tokenMonitor.expired} expired, ${tokenMonitor.rotated} rotated`);
  }
  tokenMonitor = { invalid: 0, expired: 0, rotated: 0, lastReset: Date.now() };
}, 60 * 60 * 1000);

// Groq API (Llama 3.3 70B) — Primary AI provider
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.FLOWMINT_AI_BASE_URL || 'https://api.groq.com/openai/v1';
const LLAMA_MODEL = process.env.FLOWMINT_AI_MODEL || 'llama-3.3-70b-versatile';

// Google Gemini — Fallback AI provider (when Groq rate-limits)
const GEMINI_API_KEY_RAW = process.env.GEMINI_API_KEY;
// Detect placeholder key — treat it as missing
const GEMINI_API_KEY = (GEMINI_API_KEY_RAW && !GEMINI_API_KEY_RAW.includes('PLACEHOLDER')) ? GEMINI_API_KEY_RAW : null;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ─── Startup Health Check ─────────────────────────────────
console.log('FlowMint AI: 🔑 API Keys Status:');
console.log(`  Groq:   ${GROQ_API_KEY ? '✅ Present' : '❌ MISSING — primary AI will not work'}`);
console.log(`  Gemini: ${GEMINI_API_KEY ? '✅ Present' : '⚠️  Missing or placeholder — fallback disabled'}`);

// ─── Utilities ────────────────────────────────────────────

/** Fetch with timeout — prevents hanging requests */
function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

/** Safely parse JSON from AI responses — handles code blocks, extra text, etc. */
function safeParseJSON(raw) {
  if (!raw || typeof raw !== 'string') return {};
  // Try direct parse first
  try { return JSON.parse(raw); } catch {}
  // Strip markdown code blocks
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  // Extract first JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  console.warn('FlowMint AI: ⚠️ Could not parse AI response as JSON:', raw.slice(0, 200));
  return {};
}

// ─── JWT Helper: Verify with rotation support ────────────────
function verifyTokenWithRotation(token) {
  // Try current secret first
  try {
    return jwt.verify(token, JWT_SECRET, JWT_VERIFY_OPTIONS);
  } catch (err) {
    // If verification fails and we have a previous secret (rotation in progress),
    // try the old key — this prevents downtime during key rotation
    if (JWT_SECRET_PREVIOUS && err.name !== 'TokenExpiredError') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET_PREVIOUS, JWT_VERIFY_OPTIONS);
        tokenMonitor.rotated++;
        console.log('Auth: 🔄 Token verified with previous secret (rotation in progress)');
        return decoded;
      } catch {
        // Both secrets failed
      }
    }
    throw err; // Re-throw the original error
  }
}

// ─── HTTPS Enforcement (Production) ──────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Render/Railway set x-forwarded-proto behind their load balancers
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    // HSTS header — browsers remember to always use HTTPS (1 year)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });
}

// Auth Middleware — supports JWT cookie + Supabase Bearer token
const legacyAuthenticateToken = async (req, res, next) => {
  // Strategy 1: Express JWT from cookie (web, after /auth/google or /auth/mobile)
  const cookieToken = req.cookies.access_token;
  if (cookieToken) {
    try {
      const user = verifyTokenWithRotation(cookieToken);
      req.user = user;
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        tokenMonitor.expired++;
        // Don't log every expired token — it's normal, handled by refresh flow
      } else {
        tokenMonitor.invalid++;
        console.warn(`Auth: ⚠️ Suspicious cookie token — ${err.name}: ${err.message}`);
      }
      // Cookie token invalid — fall through to other strategies
    }
  }

  // Strategy 2: Supabase Bearer token (from Supabase Auth session — e.g. Google Sign-In)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const supabaseToken = authHeader.slice(7);
    
    // Strategy 2a: Verify via Supabase Admin API (most reliable)
    try {
      const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);
      if (user && !error) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          supabase_id: user.id,
        };
        return next();
      }
      if (error) {
        console.log('Auth: Supabase getUser error:', error.message);
      }
    } catch (err) {
      console.log('Auth: Supabase getUser exception:', err.message);
    }

    // Strategy 2b: Verify Supabase JWT directly (fallback)
    // NOTE: Supabase uses its own JWT secret (Project Settings → API → JWT Secret).
    // If you are using Supabase Auth JWTs, the Supabase secret is different from JWT_SECRET.
    // The Supabase client (strategy 2a) handles this transparently.
    // This fallback only works if JWT_SECRET is set to match the Supabase JWT Secret.
    try {
      const decoded = jwt.verify(supabaseToken, JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded && decoded.sub) {
        req.user = {
          id: decoded.sub,
          email: decoded.email || '',
          name: decoded.user_metadata?.full_name || decoded.email || 'User',
          supabase_id: decoded.sub,
        };
        return next();
      }
    } catch (err) {
      // This is expected to fail if JWT_SECRET ≠ Supabase JWT Secret
      // Not a security concern — Strategy 2a is the primary path
    }
  }

  // No valid auth found
  tokenMonitor.invalid++;
  return res.status(401).json({ error: 'Please sign in to use FlowMint AI' });
};

const authenticateToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to use FlowMint AI' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(authorization.slice(7));
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.full_name || data.user.email || '',
    };
    return next();
  } catch (error) {
    console.error('Supabase session verification failed:', error);
    return res.status(401).json({ error: 'Unable to verify session' });
  }
};

/* --- Routes --- */

app.use('/auth', (_req, res) => res.status(410).json({ error: 'Use Supabase Auth for sign-in.' }));

// Google Auth Callback
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    // 1. Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload');

    const { sub: googleSub, email, name, picture } = payload;

    // 2. Upsert User in Supabase 'app_users' table
    // Check if user exists by google_sub or email
    let { data: user, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .or(`google_sub.eq.${googleSub},email.eq.${email}`)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error("Supabase fetch error:", fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('app_users')
        .insert([{ 
          google_sub: googleSub, 
          email, 
          name, 
          avatar: picture 
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = newUser;
    } else {
        // Update existing user (e.g. avatar/name updates) if needed, or link google_sub if only email matched
        if (!user.google_sub || user.name !== name || user.avatar !== picture) {
             const { data: updatedUser, error: updateError } = await supabase
                .from('app_users')
                .update({ google_sub: googleSub, name, avatar: picture })
                .eq('id', user.id)
                .select()
                .single();
             if (!updateError) user = updatedUser;
        }
    }

    // 3. Create short-lived access token + long-lived refresh token
    const tokenPayload = { id: user.id, email: user.email, name: user.name };
    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, JWT_SIGN_OPTIONS);
    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { algorithm: 'HS256', issuer: 'flowmint-server', audience: 'flowmint-app', expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // 4. Set HttpOnly Cookies (access=15min, refresh=7d)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'Strict' : 'Lax',
      maxAge: JWT_COOKIE_MAX_AGE,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'Strict' : 'Lax',
      path: '/auth', // Only sent to auth routes (minimizes exposure)
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });

    // 5. Return User
    res.json({ user, message: 'Google login successful' });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

// Mobile Auth (Simplified)
app.post('/auth/mobile', async (req, res) => {
  const { mobile } = req.body;
  
  // Basic validation
  if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  // OTP Validation is effectively skipped/handled on frontend as per user request (OTP = 123456)
  // We assume frontend checked the OTP "123456" before calling this endpoint.
  // OR we can implement the check here if passed.
  // For now, trust the call to initiate session.

  try {
     // 1. Upsert User
     let { data: user, error: fetchError } = await supabase
       .from('app_users')
       .select('*')
       .eq('mobile', mobile)
       .single();
     
     if (fetchError && fetchError.code !== 'PGRST116') {
         return res.status(500).json({ error: 'Database error' });
     }

     if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from('app_users')
          .insert([{ mobile, name: `User ${mobile.slice(-4)}` }]) // Default name
          .select()
          .single();
        if (insertError) {
             console.error("Mobile insert error:", insertError);
             return res.status(500).json({ error: 'Failed to create user' });
        }
        user = newUser;
     }

     // 2. Create short-lived access token + long-lived refresh token
     const tokenPayload = { id: user.id, mobile: user.mobile };
     const accessToken = jwt.sign(tokenPayload, JWT_SECRET, JWT_SIGN_OPTIONS);
     const refreshToken = jwt.sign(
       { id: user.id, type: 'refresh' },
       JWT_SECRET,
       { algorithm: 'HS256', issuer: 'flowmint-server', audience: 'flowmint-app', expiresIn: REFRESH_TOKEN_EXPIRY }
     );

     // 3. Set HttpOnly Cookies
     const isProduction = process.env.NODE_ENV === 'production';
     res.cookie('access_token', accessToken, {
       httpOnly: true,
       secure: isProduction,
       sameSite: isProduction ? 'Strict' : 'Lax',
       maxAge: JWT_COOKIE_MAX_AGE,
     });
     res.cookie('refresh_token', refreshToken, {
       httpOnly: true,
       secure: isProduction,
       sameSite: isProduction ? 'Strict' : 'Lax',
       path: '/auth',
       maxAge: REFRESH_COOKIE_MAX_AGE,
     });

     res.json({ user, message: 'Mobile login successful' });

  } catch (err) {
      console.error("Mobile Auth Error:", err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get User (Protected)
app.get('/auth/me', authenticateToken, async (req, res) => {
   // Optional: Refresh user data from DB to get latest
   const { data: user, error } = await supabase.from('app_users').select('*').eq('id', req.user.id).single();
   if (error || !user) return res.status(404).json({ error: 'User not found' });
   res.json({ user });
});

// ─── Token Refresh ────────────────────────────────────────
// Client calls this when access_token expires (401) to get a new one
// without requiring the user to re-login (silent refresh)
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token — please sign in again' });
  }

  try {
    // Verify the refresh token
    const decoded = verifyTokenWithRotation(refreshToken);
    if (decoded.type !== 'refresh') {
      tokenMonitor.invalid++;
      return res.status(403).json({ error: 'Invalid token type' });
    }

    // Fetch fresh user data from DB
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found — please sign in again' });
    }

    // Issue new access token (short-lived)
    const newPayload = { id: user.id, email: user.email, name: user.name, mobile: user.mobile };
    const newAccessToken = jwt.sign(newPayload, JWT_SECRET, JWT_SIGN_OPTIONS);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'Strict' : 'Lax',
      maxAge: JWT_COOKIE_MAX_AGE,
    });

    res.json({ user, message: 'Token refreshed' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      tokenMonitor.expired++;
      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/auth' });
      return res.status(401).json({ error: 'Session expired — please sign in again' });
    }
    tokenMonitor.invalid++;
    console.warn(`Auth: ⚠️ Suspicious refresh attempt — ${err.name}: ${err.message}`);
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/auth' });
  res.json({ message: 'Logged out' });
});

/* ══════════════════════════════════════════════════════════════
   FlowMint AI Routes — Powered by Llama 3.3 (via Groq)
   
   Features:
   • FREE for all users (no usage limits)
   • All conversations saved to Supabase for user history
   • Financial profile auto-built from interactions
   • Bookmarks & ratings for future LLM training data
   • Provider-agnostic: swap GROQ_BASE_URL → self-hosted vLLM
   ══════════════════════════════════════════════════════════════ */

// ─── Freemium Tier Limits (COMMENTED OUT — currently free for all users) ───
// Uncomment when ready to monetize:
// const TIER_LIMITS = {
//   free:    { wish_plans: 5,  spending_insights: 10, chat_messages: 20  },
//   pro:     { wish_plans: 50, spending_insights: 100, chat_messages: 200 },
//   premium: { wish_plans: -1, spending_insights: -1, chat_messages: -1  }, // -1 = unlimited
// };

/**
 * Helper: Call Llama 3.3 via Groq's OpenAI-compatible API
 * Returns { content, tokens, responseTimeMs, provider, model }
 */
async function callLlama(systemPrompt, userPrompt, maxTokens = 512) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const startTime = Date.now();

  const response = await fetchWithTimeout(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  }, 15000);

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const responseTimeMs = Date.now() - startTime;
  const totalTokens = data.usage?.total_tokens || 0;

  return {
    content: data.choices[0].message.content,
    tokens: totalTokens,
    responseTimeMs,
    provider: 'groq',
    model: LLAMA_MODEL,
  };
}

/**
 * Helper: Call Google Gemini API (REST — no SDK needed)
 * Used as fallback when Groq rate-limits or fails
 * Returns { content, tokens, responseTimeMs, provider, model }
 */
async function callGemini(systemPrompt, userPrompt, maxTokens = 512) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const startTime = Date.now();

  const response = await fetchWithTimeout(
    `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.' }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    },
    15000
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const responseTimeMs = Date.now() - startTime;

  // Extract text from Gemini response structure
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const totalTokens = (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0);

  return {
    content: rawContent,
    tokens: totalTokens,
    responseTimeMs,
    provider: 'gemini',
    model: GEMINI_MODEL,
  };
}

/**
 * Unified AI call — Tries Groq (Llama 3.3) first, then Gemini as fallback.
 * This ensures users ALWAYS get an AI response, even during Groq rate limits.
 * 
 * Fallback chain: Groq → Gemini → throws (caller handles math fallback)
 */
async function callAI(systemPrompt, userPrompt, maxTokens = 512) {
  // 1. Try Groq (Llama 3.3) — primary provider
  try {
    const result = await callLlama(systemPrompt, userPrompt, maxTokens);
    console.log(`FlowMint AI: ✅ Groq responded (${result.responseTimeMs}ms, ${result.tokens} tokens)`);
    return result;
  } catch (groqError) {
    console.warn(`FlowMint AI: ⚠️ Groq failed — ${groqError.message}`);
  }

  // 2. Fallback to Gemini
  try {
    const result = await callGemini(systemPrompt, userPrompt, maxTokens);
    console.log(`FlowMint AI: 🔄 Gemini fallback responded (${result.responseTimeMs}ms)`);
    return result;
  } catch (geminiError) {
    console.warn(`FlowMint AI: ⚠️ Gemini also failed — ${geminiError.message}`);
  }

  // 3. Both providers failed — throw so caller can use math fallback
  throw new Error('All AI providers failed (Groq + Gemini)');
}

// ─── Usage Limit Helpers (COMMENTED OUT — currently free for all users) ───
// Uncomment checkUsageLimit() and incrementUsage() when ready to monetize.

// /**
//  * Helper: Check and update usage limits for a user
//  * Returns { allowed, usage, limit, tier }
//  */
// async function checkUsageLimit(userId, usageType) {
//   const today = new Date().toISOString().split('T')[0];
//   let { data: usage, error } = await supabase
//     .from('ai_usage').select('*').eq('user_id', userId).eq('usage_date', today).single();
//   if (error && error.code === 'PGRST116') {
//     const { data: newUsage, error: insertErr } = await supabase
//       .from('ai_usage').insert([{ user_id: userId, usage_date: today, tier: 'free' }]).select().single();
//     if (insertErr) return { allowed: true, usage: 0, limit: TIER_LIMITS.free[usageType], tier: 'free' };
//     usage = newUsage;
//   }
//   const tier = usage?.tier || 'free';
//   const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
//   const limit = limits[usageType];
//   const columnMap = { wish_plans: 'wish_plans_used', spending_insights: 'spending_insights_used', chat_messages: 'chat_messages_used' };
//   const currentUsage = usage?.[columnMap[usageType]] || 0;
//   const allowed = limit === -1 || currentUsage < limit;
//   return { allowed, usage: currentUsage, limit, tier, usageId: usage?.id };
// }

// /**
//  * Helper: Increment usage counter after a successful AI call
//  */
// async function incrementUsage(userId, usageType, tokensUsed = 0) {
//   const today = new Date().toISOString().split('T')[0];
//   const columnMap = { wish_plans: 'wish_plans_used', spending_insights: 'spending_insights_used', chat_messages: 'chat_messages_used' };
//   const { data: usage } = await supabase
//     .from('ai_usage').select('*').eq('user_id', userId).eq('usage_date', today).single();
//   if (usage) {
//     await supabase.from('ai_usage').update({
//       [columnMap[usageType]]: (usage[columnMap[usageType]] || 0) + 1,
//       total_tokens_used: (usage.total_tokens_used || 0) + tokensUsed,
//     }).eq('id', usage.id);
//   }
// }

/**
 * Helper: Save conversation to Supabase and update financial profile
 */
async function saveConversation(userId, { type, title, inputContext, aiResponse, modelUsed, provider, responseTimeMs, tokensUsed }) {
  // 1. Save the conversation
  const { data: conversation, error } = await supabase
    .from('ai_conversations')
    .insert([{
      user_id: userId,
      type,
      title,
      status: 'completed',
      input_context: inputContext,
      ai_response: aiResponse,
      model_used: modelUsed || LLAMA_MODEL,
      provider: provider || 'groq',
      response_time_ms: responseTimeMs,
      tokens_used: tokensUsed,
    }])
    .select()
    .single();

  if (error) {
    // Non-fatal — log but don't block the AI response
    console.warn('FlowMint: ⚠️ Conversation save failed (non-fatal):', error.message || error.code);
    // Common: table doesn't exist yet, RLS policy blocked, etc.
  }

  return conversation;
}

/**
 * Helper: Progressively build the user's financial profile
 * Each AI interaction enriches the profile with more data
 */
async function updateFinancialProfile(userId, context) {
  try {
    // Check if profile exists
    let { data: profile } = await supabase
      .from('user_financial_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const updates = {
      last_ai_interaction: new Date().toISOString(),
    };

    // Only update financial fields if they're provided and non-zero
    if (context.monthlyIncome && context.monthlyIncome > 0) {
      updates.monthly_income = context.monthlyIncome;
    }
    if (context.monthlyExpenses && context.monthlyExpenses > 0) {
      updates.monthly_expenses = context.monthlyExpenses;
    }
    if (context.existingEMIs !== undefined) {
      updates.existing_emis = context.existingEMIs;
    }
    if (context.topSpendingCategories?.length > 0) {
      updates.top_spending_categories = context.topSpendingCategories;
    }

    // Calculate derived fields
    if (updates.monthly_income && updates.monthly_expenses) {
      const savings = updates.monthly_income - updates.monthly_expenses - (updates.existing_emis || 0);
      updates.monthly_savings = savings;
      updates.savings_rate = Math.round((savings / updates.monthly_income) * 100);
    }

    // Calculate profile completeness
    const fields = ['monthly_income', 'monthly_expenses', 'existing_emis', 'top_spending_categories', 'credit_score'];
    const merged = { ...profile, ...updates };
    const filled = fields.filter(f => merged[f] && (Array.isArray(merged[f]) ? merged[f].length > 0 : true));
    updates.profile_completeness = Math.round((filled.length / fields.length) * 100);

    if (!profile) {
      // Create new profile
      await supabase
        .from('user_financial_profiles')
        .insert([{ user_id: userId, ...updates, total_ai_interactions: 1 }]);
    } else {
      // Update existing profile
      await supabase
        .from('user_financial_profiles')
        .update({
          ...updates,
          total_ai_interactions: (profile.total_ai_interactions || 0) + 1,
        })
        .eq('user_id', userId);
    }
  } catch (err) {
    console.error('Financial profile update error:', err.message);
  }
}

/**
 * Helper: Queue high-quality conversations for future LLM training
 */
async function queueForTraining(conversationId, instruction, response, rating, tags = []) {
  const qualityScore = rating ? rating / 5.0 : 0.5; // Normalize 1-5 → 0.0-1.0

  if (qualityScore >= 0.6) { // Only queue above-average responses
    await supabase
      .from('ai_training_queue')
      .insert([{
        conversation_id: conversationId,
        instruction,
        response,
        user_rating: rating,
        quality_score: qualityScore,
        tags,
      }]);
  }
}

// ─── API Routes ───────────────────────────────────────────

async function getAuthenticatedFinancialData(userId) {
  const [profileResult, transactionsResult] = await Promise.all([
    supabase
      .from('user_financial_profiles')
      .select('monthly_income, monthly_expenses, current_savings, monthly_rent_emi')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('transactions')
      .select('title, amount, category, type, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .order('date', { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (transactionsResult.error) throw transactionsResult.error;
  return { profile: profileResult.data, transactions: transactionsResult.data || [] };
}

function hasCompleteFinancialProfile(profile) {
  return !!profile &&
    profile.monthly_income !== null &&
    profile.monthly_expenses !== null &&
    profile.current_savings !== null &&
    profile.monthly_rent_emi !== null;
}

/**
 * GET /api/ai/usage
 * Returns unlimited status since AI is free for all users.
 * (Usage tracking is commented out — uncomment when ready to monetize)
 */
app.get('/api/ai/usage', authenticateToken, async (req, res) => {
  // Currently free for all users — return unlimited
  res.json({
    tier: 'free',
    today: {
      wish_plans:        { used: 0, limit: -1 },
      spending_insights: { used: 0, limit: -1 },
      chat_messages:     { used: 0, limit: -1 },
      total_tokens:      0,
    },
    unlimited: true,
  });
});

/**
 * POST /api/ai/wish-plan
 * Generate a personalized saving plan for a wish/goal
 * Saves conversation + updates financial profile + tracks usage
 */
app.post('/api/ai/wish-plan', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  // Usage limits disabled — free for all users
  // Uncomment below when ready to monetize:
  // const { allowed, usage, limit, tier } = await checkUsageLimit(userId, 'wish_plans');
  // if (!allowed) {
  //   return res.status(429).json({
  //     error: 'Daily limit reached',
  //     message: `You've used all ${limit} free wish plans for today. Upgrade to Pro for more!`,
  //     usage, limit, tier, upgradeUrl: '/settings/upgrade',
  //   });
  // }

  const { wishName, price } = req.body;
  if (typeof wishName !== 'string' || !wishName.trim() ||
      !Number.isFinite(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'Enter a goal name and a positive target amount.' });
  }

  let financialData;
  try {
    financialData = await getAuthenticatedFinancialData(userId);
  } catch (error) {
    console.error('Unable to load authenticated financial data for wish plan:', error);
    return res.status(503).json({ error: 'Your financial profile is temporarily unavailable.' });
  }
  if (!hasCompleteFinancialProfile(financialData.profile)) {
    return res.status(409).json({ error: 'Complete your financial profile before requesting a personalized plan.' });
  }

  const profile = financialData.profile;
  const targetAmount = Number(price);
  const currentSavings = Number(profile.current_savings);
  const monthlyIncome = Number(profile.monthly_income);
  const monthlyExpenses = Number(profile.monthly_expenses);
  const monthlyRentEmi = Number(profile.monthly_rent_emi);
  const monthlySurplus = monthlyIncome - monthlyExpenses - monthlyRentEmi;
  const topSpendingCategories = [...new Set(financialData.transactions.map((transaction) => transaction.category).filter(Boolean))].slice(0, 5);
  const inputContext = { wishName: wishName.trim(), price: targetAmount, currentSavings, monthlyIncome, monthlyExpenses, monthlyRentEmi, monthlySurplus, topSpendingCategories };

  const systemPrompt = `You are FlowMint AI, a witty and sharp financial advisor for Indian Gen-Z and Millennials.

PERSONALITY:
- Use Gen-Z lingo naturally (no cap, bet, vibe check, flex) but stay financially accurate
- Be direct, actionable, and motivating
- Understand Indian financial products: SIP, PPF, FD, RD, UPI, EMI, CIBIL, NPS, ELSS, 80C
- Reference Indian brands/context: Swiggy, Zomato, Zerodha, Groww, PhonePe, Netflix India pricing
- All amounts in ₹ (Indian Rupees)

TASK: Create a personalized saving plan for the user's wish.

RESPOND ONLY with valid JSON in this exact schema:
{
  "aiTip": "A concise 1-2 sentence prediction about when they can achieve this goal",
  "speedUpTip": "One specific, actionable tip to speed up this goal (reference their actual spending categories if available)",
  "monthsToAfford": <number>,
  "savingSteps": ["Step 1 with specific ₹ amounts", "Step 2", "Step 3"]
}`;

  const userPrompt = `The user wants to save for "${wishName.trim()}" costing ₹${targetAmount.toLocaleString('en-IN')}.
Their current savings are ₹${currentSavings.toLocaleString('en-IN')}.

Authenticated financial profile:
- Monthly income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Monthly rent/EMI: ₹${monthlyRentEmi.toLocaleString('en-IN')}
- Estimated monthly surplus: ₹${monthlySurplus.toLocaleString('en-IN')}
${topSpendingCategories.length > 0 ? `- Recent expense categories: ${topSpendingCategories.join(', ')}` : '- No recent expense records are available.'}

Create a realistic, advisory-only saving plan. Do not claim to move or invest money.`;

  try {
    const { content: rawResponse, tokens, responseTimeMs, provider, model } = await callAI(systemPrompt, userPrompt);
    const plan = safeParseJSON(rawResponse);

    if (typeof plan.aiTip !== 'string' || typeof plan.speedUpTip !== 'string' ||
        !Number.isFinite(Number(plan.monthsToAfford)) || !Array.isArray(plan.savingSteps)) {
      throw new Error('AI provider returned an invalid savings plan.');
    }
    const result = {
      aiTip: plan.aiTip,
      speedUpTip: plan.speedUpTip,
      monthsToAfford: Math.max(0, Math.ceil(Number(plan.monthsToAfford))),
      savingSteps: plan.savingSteps.filter((step) => typeof step === 'string').slice(0, 5),
    };

    // Save conversation to Supabase
    const conversation = await saveConversation(userId, {
      type: 'wish_plan',
      title: `${wishName} — Saving Plan`,
      inputContext,
      aiResponse: result,
      modelUsed: model,
      provider,
      responseTimeMs,
      tokensUsed: tokens,
    });

    // Return result with provider info for frontend badge
    res.json({
      ...result,
      conversationId: conversation?.id,
      provider,
      model,
      responseTimeMs,
    });
  } catch (error) {
    console.error('FlowMint AI — Wish Plan Error:', error);
    return res.status(503).json({ error: 'FlowMint could not generate a plan right now. Please try again later.' });
  }
});

/**
 * POST /api/ai/spending-insight
 * Analyze transactions and return a spending personality + tip
 */
app.post('/api/ai/spending-insight', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  // Usage limits disabled — free for all users
  // const { allowed, usage, limit, tier } = await checkUsageLimit(userId, 'spending_insights');
  // if (!allowed) {
  //   return res.status(429).json({
  //     error: 'Daily limit reached',
  //     message: `You've used all ${limit} free spending insights for today.`,
  //     usage, limit, tier,
  //   });
  // }

  let financialData;
  try {
    financialData = await getAuthenticatedFinancialData(userId);
  } catch (error) {
    console.error('Unable to load authenticated financial data for insight:', error);
    return res.status(503).json({ error: 'Your financial information is temporarily unavailable.' });
  }
  if (!hasCompleteFinancialProfile(financialData.profile)) {
    return res.status(409).json({ error: 'Complete your financial profile before requesting an insight.' });
  }

  const profile = financialData.profile;
  const monthlyIncome = Number(profile.monthly_income);
  const monthlyExpenses = Number(profile.monthly_expenses);
  const currentSavings = Number(profile.current_savings);
  const monthlyRentEmi = Number(profile.monthly_rent_emi);
  const transactions = financialData.transactions;

  const systemPrompt = `You are FlowMint AI, a witty financial advisor for Indian millennials.

Analyze the user's spending data and return a JSON response with:
{
  "personality": "A fun 2-3 word spending personality label (e.g., 'The Strategic Saver', 'The Weekend Warrior', 'The Subscription King')",
  "tip": "One sharp, actionable financial tip in 1-2 sentences. Reference specific patterns you see in their data. Use Indian context."
}

RESPOND ONLY with valid JSON.`;

  const txSummary = transactions.length > 0
    ? `Recent user-entered expenses:\n${transactions.map(t => `- ${t.title}: ₹${Number(t.amount).toLocaleString('en-IN')} (${t.category})`).join('\n')}`
    : 'The user has not recorded any recent individual expenses. Do not infer spending patterns.';

  const userPrompt = `${txSummary}

Financial snapshot:
- Monthly income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly expenses (excluding rent/EMI): ₹${monthlyExpenses.toLocaleString('en-IN')}
- Current savings: ₹${currentSavings.toLocaleString('en-IN')}
- Monthly rent/EMI: ₹${monthlyRentEmi.toLocaleString('en-IN')}
- Estimated monthly surplus: ₹${(monthlyIncome - monthlyExpenses - monthlyRentEmi).toLocaleString('en-IN')}

Give one useful, evidence-based financial insight. Explicitly say when there is not enough transaction history to identify a spending pattern.`;

  const inputContext = { transactions, monthlyIncome, monthlyExpenses, currentSavings, monthlyRentEmi };

  try {
    const { content: rawResponse, tokens, responseTimeMs, provider, model } = await callAI(systemPrompt, userPrompt, 256);
    const insight = safeParseJSON(rawResponse);

    if (typeof insight.personality !== 'string' || typeof insight.tip !== 'string') {
      throw new Error('AI provider returned an invalid financial insight.');
    }
    const result = { personality: insight.personality, tip: insight.tip };

    // Save conversation
    const conversation = await saveConversation(userId, {
      type: 'spending_insight',
      title: `Spending Analysis — ${result.personality}`,
      inputContext,
      aiResponse: result,
      responseTimeMs,
      tokensUsed: tokens,
    });

    // await incrementUsage(userId, 'spending_insights', tokens);

    res.json({ ...result, conversationId: conversation?.id, provider, model });
  } catch (error) {
    console.error('FlowMint AI — Insight Error:', error);
    return res.status(503).json({ error: 'FlowMint could not generate an insight right now. Please try again later.' });
  }
});

/**
 * POST /api/ai/chat
 * General-purpose financial chat — ask anything about savings, spending, loans, credit, etc.
 * Uses the same AI fallback chain (Groq → Gemini → static fallback).
 * Conversations are saved to Supabase for user history.
 */
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 2000) {
    return res.status(413).json({ error: 'Messages must be 2,000 characters or fewer.' });
  }

  let financialData;
  try {
    financialData = await getAuthenticatedFinancialData(userId);
  } catch (error) {
    console.error('Unable to load authenticated financial data for chat:', error);
    return res.status(503).json({ error: 'Your financial information is temporarily unavailable.' });
  }
  if (!hasCompleteFinancialProfile(financialData.profile)) {
    return res.status(409).json({ error: 'Complete your financial profile before using personalized AI.' });
  }
  const profile = financialData.profile;
  const monthlyIncome = Number(profile.monthly_income);
  const monthlyExpenses = Number(profile.monthly_expenses);
  const currentSavings = Number(profile.current_savings);
  const monthlyRentEmi = Number(profile.monthly_rent_emi);
  const expenseSummary = financialData.transactions.length
    ? financialData.transactions.map((transaction) => `${transaction.category}: ₹${Number(transaction.amount).toLocaleString('en-IN')}`).join(', ')
    : 'No recent individual expense records';

  const systemPrompt = `You are FlowMint AI, a witty, knowledgeable, and sharp financial advisor for Indian Gen-Z and Millennials.

PERSONALITY:
- Use Gen-Z lingo naturally (no cap, bet, vibe check, flex) but stay financially accurate
- Be direct, actionable, and motivating
- Be conversational but concise — keep responses under 150 words
- Understand Indian financial products: SIP, PPF, FD, RD, UPI, EMI, CIBIL/credit score, NPS, ELSS, 80C, HRA
- Reference Indian context: Swiggy, Zomato, Zerodha, Groww, PhonePe, Netflix India pricing
- All amounts in ₹ (Indian Rupees)

CAPABILITIES:
- Budgeting, expense tracking, savings plans, goals, and purchase affordability
- Basic savings, emergency-fund, and EMI calculations
- Make clear that advice is educational and does not move money or constitute professional advice
- Never claim access to bank accounts, loans, or credit scores

RESPOND ONLY with valid JSON in this exact schema:
{
  "reply": "Your conversational response here",
  "category": "savings|spending|credit|loans|investing|tax|insurance|general",
  "actionable": true/false,
  "followUp": "Optional follow-up question to engage the user"
}`;

  const userPrompt = `Authenticated financial profile (source of truth):
- Monthly income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly expenses, excluding rent/EMI: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Current savings: ₹${currentSavings.toLocaleString('en-IN')}
- Monthly rent/EMI: ₹${monthlyRentEmi.toLocaleString('en-IN')}
- Estimated monthly surplus: ₹${(monthlyIncome - monthlyExpenses - monthlyRentEmi).toLocaleString('en-IN')}
- Recent expense records: ${expenseSummary}

User question: ${message}`;

  try {
    const { content: rawResponse, tokens, responseTimeMs, provider, model } = await callAI(systemPrompt, userPrompt, 512);
    const parsed = safeParseJSON(rawResponse);

    if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) {
      throw new Error('AI provider returned an invalid chat response.');
    }
    const result = {
      reply: parsed.reply,
      category: typeof parsed.category === 'string' ? parsed.category : 'general',
      actionable: parsed.actionable === true,
      followUp: typeof parsed.followUp === 'string' ? parsed.followUp : null,
    };

    // Save conversation to Supabase
    const conversation = await saveConversation(userId, {
      type: 'chat',
      title: message.slice(0, 80),
      inputContext: { message, monthlyIncome, monthlyExpenses, currentSavings, monthlyRentEmi },
      aiResponse: result,
      modelUsed: model,
      provider,
      responseTimeMs,
      tokensUsed: tokens,
    });

    res.json({
      ...result,
      conversationId: conversation?.id,
      provider,
      model,
      responseTimeMs,
    });
  } catch (error) {
    console.error('FlowMint AI — Chat Error:', error);
    return res.status(503).json({ error: 'FlowMint AI is unavailable right now. Please try again later.' });
  }
});

/**
 * GET /api/ai/history
 * Retrieve the user's past AI conversations
 * Query params: ?type=wish_plan&limit=20&offset=0&bookmarked=true
 */
app.get('/api/ai/history', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { type, limit = 20, offset = 0, bookmarked } = req.query;

  let query = supabase
    .from('ai_conversations')
    .select('id, type, title, status, input_context, ai_response, model_used, user_rating, is_bookmarked, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (type) {
    query = query.eq('type', type);
  }
  if (bookmarked === 'true') {
    query = query.eq('is_bookmarked', true);
  }

  const { data: conversations, error, count } = await query;

  if (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }

  res.json({
    conversations: conversations || [],
    total: count,
    hasMore: (conversations?.length || 0) === parseInt(limit),
  });
});

/**
 * GET /api/ai/conversations/:id
 * Get a single conversation with full details
 */
app.get('/api/ai/conversations/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data: conversation, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.json(conversation);
});

/**
 * PATCH /api/ai/conversations/:id
 * Rate, bookmark, or provide feedback on a conversation
 * Body: { rating?: 1-5, is_bookmarked?: boolean, user_feedback?: string }
 */
app.patch('/api/ai/conversations/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { rating, is_bookmarked, user_feedback } = req.body;

  // Only allow updating specific fields
  const updates = {};
  if (rating !== undefined && rating >= 1 && rating <= 5) updates.user_rating = rating;
  if (is_bookmarked !== undefined) updates.is_bookmarked = is_bookmarked;
  if (user_feedback !== undefined) updates.user_feedback = user_feedback;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const { data: conversation, error } = await supabase
    .from('ai_conversations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // If user rated highly, queue for future LLM training
  if (updates.user_rating && updates.user_rating >= 4) {
    const inputText = JSON.stringify(conversation.input_context);
    const responseText = JSON.stringify(conversation.ai_response);
    const tags = [conversation.type];
    if (conversation.input_context?.wishName) tags.push('wish_plan');
    if (conversation.input_context?.price > 100000) tags.push('high_value');

    await queueForTraining(conversation.id, inputText, responseText, updates.user_rating, tags);
  }

  res.json(conversation);
});

/**
 * GET /api/ai/profile
 * Get the user's auto-built financial profile
 */
app.get('/api/ai/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const { data: profile, error } = await supabase
    .from('user_financial_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No profile yet
    return res.json({ exists: false, profile_completeness: 0 });
  }

  res.json({ exists: true, ...profile });
});

/* ══════════════════════════════════════════════════════════════
   FlowMint CRUD Routes — Core Data Layer (Tier 1)
   
   Endpoints for: Transactions, Expenses, Bills, Goals, Payments
   All routes are JWT-protected and use Supabase Admin client.
   ══════════════════════════════════════════════════════════════ */

// ─── Helper: Get Supabase Auth user_id from request ───────
function getAuthUserId(req) {
  // Prefer Supabase auth UID (from signInWithIdToken flow)
  if (req.user?.supabase_id) return req.user.supabase_id;
  // Fallback to Express JWT user ID
  return req.user?.id;
}

// ─── Validation Helpers ───────────────────────────────────
function validateRequired(fields, body) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

function validatePositiveNumber(value, fieldName) {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return `${fieldName} must be a valid positive number`;
  }
  return null;
}

// ─── TRANSACTIONS ─────────────────────────────────────────

// GET /api/transactions — Fetch user's transactions (paginated)
app.get('/api/transactions', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { limit = 20, offset = 0, category, type } = req.query;

  try {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) query = query.eq('category', category);
    if (type) query = query.eq('type', type);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ transactions: data || [], total: count, hasMore: (data?.length || 0) === parseInt(limit) });
  } catch (err) {
    console.error('Transactions GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions', detail: err.message });
  }
});

// POST /api/transactions — Create a new transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { title, amount, category, type, date, is_recurring, merchant, notes } = req.body;

  const validationError = validateRequired(['title', 'amount', 'category', 'type'], req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const amountError = validatePositiveNumber(amount, 'Amount');
  if (amountError) return res.status(400).json({ error: amountError });

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId, title: title.trim(), amount: Number(amount),
        category: category.trim(), type, date: date || new Date().toISOString(),
        is_recurring: is_recurring || false, merchant: merchant?.trim(), notes: notes?.trim(),
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ transaction: data, message: 'Transaction recorded' });
  } catch (err) {
    console.error('Transactions POST error:', err.message);
    res.status(500).json({ error: 'Failed to save transaction', detail: err.message });
  }
});

// ─── EXPENSES ─────────────────────────────────────────────

// GET /api/expenses — Fetch user's expenses
app.get('/api/expenses', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { limit = 30, category } = req.query;

  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(parseInt(limit));

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ expenses: data || [] });
  } catch (err) {
    console.error('Expenses GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expenses', detail: err.message });
  }
});

// POST /api/expenses — Create a new expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { title, amount, category, date, notes, is_recurring } = req.body;

  const validationError = validateRequired(['title', 'amount', 'category'], req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const amountError = validatePositiveNumber(amount, 'Amount');
  if (amountError) return res.status(400).json({ error: amountError });

  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        user_id: userId, title: title.trim(), amount: Number(amount),
        category: category.trim(), date: date || new Date().toISOString(),
        notes: notes?.trim(), is_recurring: is_recurring || false,
      }])
      .select()
      .single();

    if (error) throw error;

    // Also create a corresponding transaction record to keep the dashboard summary in sync
    await supabase.from('transactions').insert([{
      user_id: userId, title: title.trim(), amount: Number(amount),
      category: category.trim(), type: 'expense', date: date || new Date().toISOString(),
    }]).catch(e => console.warn('Auto-transaction creation failed (non-fatal):', e.message));

    res.status(201).json({ expense: data, message: 'Expense saved' });
  } catch (err) {
    console.error('Expenses POST error:', err.message);
    res.status(500).json({ error: 'Failed to save expense', detail: err.message });
  }
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Expenses DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to delete expense', detail: err.message });
  }
});

// GET /api/expenses/summary — Monthly aggregation
app.get('/api/expenses/summary', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { months = 4 } = req.query;

  try {
    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(months));

    const { data, error } = await supabase
      .from('expenses')
      .select('date, amount, category')
      .eq('user_id', userId)
      .gte('date', since.toISOString());

    if (error) throw error;

    // Aggregate by month
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthly = {};
    const categories = {};

    (data || []).forEach(row => {
      const d = new Date(row.date);
      const monthKey = monthNames[d.getMonth()];
      monthly[monthKey] = (monthly[monthKey] || 0) + Number(row.amount);
      categories[row.category] = (categories[row.category] || 0) + Number(row.amount);
    });

    res.json({
      monthly: Object.entries(monthly).map(([month, total]) => ({ month, total })),
      categories: Object.entries(categories)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total),
      totalExpenses: (data || []).reduce((s, r) => s + Number(r.amount), 0),
    });
  } catch (err) {
    console.error('Expenses summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expense summary', detail: err.message });
  }
});

// ─── BILLS ────────────────────────────────────────────────

// GET /api/bills
app.get('/api/bills', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { status } = req.query; // 'paid', 'unpaid', 'overdue'

  try {
    let query = supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (status === 'paid') query = query.eq('is_paid', true);
    if (status === 'unpaid') query = query.eq('is_paid', false);
    if (status === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('is_paid', false).lt('due_date', today);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate summary
    const today = new Date().toISOString().split('T')[0];
    const allBills = data || [];
    const unpaid = allBills.filter(b => !b.is_paid);
    const overdue = unpaid.filter(b => b.due_date < today);

    res.json({
      bills: allBills,
      summary: {
        totalDue: unpaid.reduce((s, b) => s + Number(b.amount), 0),
        unpaidCount: unpaid.length,
        overdueCount: overdue.length,
      },
    });
  } catch (err) {
    console.error('Bills GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bills', detail: err.message });
  }
});

// POST /api/bills
app.post('/api/bills', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { title, amount, due_date, type, is_recurring, icon } = req.body;

  const validationError = validateRequired(['title', 'amount', 'due_date'], req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const { data, error } = await supabase
      .from('bills')
      .insert([{
        user_id: userId, title: title.trim(), amount: Number(amount),
        due_date, type: type || 'Utility', is_recurring: is_recurring || false,
        icon: icon || 'receipt',
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ bill: data, message: 'Bill added' });
  } catch (err) {
    console.error('Bills POST error:', err.message);
    res.status(500).json({ error: 'Failed to create bill', detail: err.message });
  }
});

// PATCH /api/bills/:id/pay — Mark a bill as paid
app.patch('/api/bills/:id/pay', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);

  try {
    const { data, error } = await supabase
      .from('bills')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Bill not found' });

    /*
    // Legacy simulated payment recording retained for reference, intentionally disabled in V1.
    await Promise.allSettled([
      supabase.from('payments').insert([{
        user_id: userId, recipient: data.title, amount: data.amount,
        method: 'UPI', status: 'completed', notes: `Bill payment: ${data.title}`,
      }]),
      supabase.from('transactions').insert([{
        user_id: userId, title: `Bill: ${data.title}`, amount: data.amount,
        category: data.type || 'Bills', type: 'expense',
      }]),
    ]);
    */

    res.json({ bill: data, message: `${data.title} recorded as paid outside FlowMint` });
  } catch (err) {
    console.error('Bills PATCH error:', err.message);
    res.status(500).json({ error: 'Failed to update bill', detail: err.message });
  }
});

// ─── GOALS ────────────────────────────────────────────────

// GET /api/goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);

  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ goals: data || [] });
  } catch (err) {
    console.error('Goals GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch goals', detail: err.message });
  }
});

// POST /api/goals
app.post('/api/goals', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { name, target_amount, deadline, category } = req.body;

  const validationError = validateRequired(['name', 'target_amount'], req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const amountError = validatePositiveNumber(target_amount, 'Target amount');
  if (amountError) return res.status(400).json({ error: amountError });

  try {
    const { data, error } = await supabase
      .from('goals')
      .insert([{
        user_id: userId, name: name.trim(),
        target_amount: Number(target_amount), current_amount: 0,
        deadline, category: category || 'General', status: 'active',
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ goal: data, message: 'Goal created! Let\'s get saving 💪' });
  } catch (err) {
    console.error('Goals POST error:', err.message);
    res.status(500).json({ error: 'Failed to create goal', detail: err.message });
  }
});

// PATCH /api/goals/:id — Update progress or AI plan
app.patch('/api/goals/:id', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { add_amount, ai_plan, status } = req.body;

  try {
    // Get current goal
    const { data: current, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !current) return res.status(404).json({ error: 'Goal not found' });

    const updates = {};
    if (add_amount) {
      const newAmount = Number(current.current_amount) + Number(add_amount);
      updates.current_amount = newAmount;
      if (newAmount >= Number(current.target_amount)) {
        updates.status = 'completed';
      }
    }
    if (ai_plan) updates.ai_plan = ai_plan;
    if (status && ['active', 'completed', 'paused'].includes(status)) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ goal: data, message: updates.status === 'completed' ? '🎉 Goal achieved!' : 'Goal updated' });
  } catch (err) {
    console.error('Goals PATCH error:', err.message);
    res.status(500).json({ error: 'Failed to update goal', detail: err.message });
  }
});

// DELETE /api/goals/:id
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  try {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ message: 'Goal removed' });
  } catch (err) {
    console.error('Goals DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to delete goal', detail: err.message });
  }
});

// ─── PAYMENTS ─────────────────────────────────────────────

// GET /api/credit-score (Apify Actor vivid_astronaut/credit-score Integration)
app.get('/api/credit-score', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const forceRefresh = req.query.refresh === 'true';

  try {
    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    
    // 1. Fetch current profile from DB (This is the ultimate source of truth for the 30-day rule)
    const { data: profile } = await supabase
      .from('user_financial_profiles')
      .select('credit_score, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    let canFetch = true;
    let nextRefreshDate = null;

    // RULE: If they already have a credit score stored in the DB, check how old it is.
    if (profile && profile.credit_score && profile.updated_at) {
      // User explicitly requested Day 1 as the starting point instead of Day 0
      const daysSince = Math.floor((Date.now() - new Date(profile.updated_at).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Update the DB column with the exact elapsed days as requested, explicitly awaited so it guarantees the save
      await supabase.from('user_financial_profiles')
        .update({ credit_score_generated_day_count: daysSince })
        .eq('user_id', userId);

      // If the day count hasn't reached more than 30 days yet, DO NOT hit Apify
      if (daysSince <= 30) {
        canFetch = false;
        const nextDate = new Date(profile.updated_at);
        nextDate.setDate(nextDate.getDate() + 30);
        nextRefreshDate = nextDate.toISOString();
      }
    }

    // 3. User explicit intent validation
    if (!forceRefresh) {
      return res.json({
        creditScore: profile?.credit_score || null,
        cached: true,
        nextRefreshAvailable: nextRefreshDate
      });
    }

    if (!canFetch) {
      return res.json({
        creditScore: profile?.credit_score || null,
        cached: true,
        nextRefreshAvailable: nextRefreshDate,
        message: 'Active profile synced via Database.'
      });
    }

    if (canFetch) {
      if (!APIFY_TOKEN) {
        console.warn('APIFY_API_TOKEN missing. Returning cached or mock score.');
        return res.json({ creditScore: profile?.credit_score || 900, cached: true });
      }

      // Call vivid_astronaut/credit-score actor synchronously
      const response = await fetch(`https://api.apify.com/v2/acts/vivid_astronaut~credit-score/run-sync-get-dataset-items?token=${APIFY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: "/api/v1/process", data: {} }) 
      });

      if (!response.ok) throw new Error(`Apify failed: ${response.statusText}`);
      const apifyData = await response.json();

      if (!apifyData || apifyData.length === 0 || !apifyData[0].result) {
        throw new Error("No risk assessment result provided by Actor");
      }

      const assessment = apifyData[0].result;
      const riskScore = assessment.risk_score || 50;
      const computedCreditScore = Math.max(300, Math.min(900, Math.round(850 - (riskScore * 2.5))));

      // 🚨 CRITICAL FAIL-SAFE: Ensure user exists in `app_users` before saving!
      // If logging in via OTP bypass or fresh OAuth, the webhook might not have fired yet.
      // If `app_users` lacks this user_id, it physically blocks `audit_logs` & `user_financial_profiles` saves (Foreign Key crash).
      const { error: userSyncErr } = await supabase.from('app_users')
        .upsert({ id: userId, name: 'FlowMint Synced User' }, { onConflict: 'id' });
      if (userSyncErr) console.warn("App user check warning:", userSyncErr.message);

      // Update DB with the latest score and STRICTLY initialize day count to 1 in the same query (1-based index per user request)
      const { error: upsertErr } = await supabase.from('user_financial_profiles')
        .upsert({ 
          user_id: userId, 
          credit_score: computedCreditScore, 
          credit_score_generated_day_count: 1,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });
      if (upsertErr) throw new Error("Database Error (Profiles): " + upsertErr.message);

      // Add to audit logs to restrict the next fetch
      const { error: auditErr } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'FETCH_CREDIT_SCORE',
        metadata: { score: computedCreditScore, source: 'apify' }
      });
      if (auditErr) throw new Error("Database Error (Audit Logs): " + auditErr.message);

      const newNextRefresh = new Date();
      newNextRefresh.setDate(newNextRefresh.getDate() + 30);

      res.json({
        creditScore: computedCreditScore,
        riskLevel: assessment.risk_level,
        approvalLikelihood: assessment.approval_likelihood,
        debtToIncomeRatio: assessment.debt_to_income_ratio,
        source: 'apify',
        nextRefreshAvailable: newNextRefresh.toISOString()
      });
    }

  } catch (err) {
    console.error('Apify Credit Score API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch credit score', detail: err.message });
  }
});

// Legacy simulated payment handlers are retained below but disabled for V1.
app.use('/api/payments', (_req, res) => res.status(410).json({
  error: 'Payments are disabled. FlowMint V1 tracks expenses and does not move money.',
}));

// GET /api/payments (disabled by the middleware above)
app.get('/api/payments', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { limit = 20 } = req.query;

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;
    res.json({ payments: data || [] });
  } catch (err) {
    console.error('Payments GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payments', detail: err.message });
  }
});

// POST /api/payments
app.post('/api/payments', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);
  const { recipient, amount, method, upi_id, notes } = req.body;

  const validationError = validateRequired(['recipient', 'amount'], req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const referenceId = 'FM' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        user_id: userId, recipient: recipient.trim(), amount: Number(amount),
        method: method || 'UPI', status: 'completed',
        upi_id: upi_id?.trim(), reference_id: referenceId, notes: notes?.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Auto-create transaction record
    await supabase.from('transactions').insert([{
      user_id: userId, title: `Payment to ${recipient.trim()}`, amount: Number(amount),
      category: 'Payment', type: 'expense',
    }]).catch(e => console.warn('Auto-transaction for payment failed (non-fatal):', e.message));

    res.status(201).json({ payment: data, message: `₹${Number(amount).toLocaleString('en-IN')} sent to ${recipient}` });
  } catch (err) {
    console.error('Payments POST error:', err.message);
    res.status(500).json({ error: 'Failed to process payment', detail: err.message });
  }
});

// ─── DASHBOARD SUMMARY ───────────────────────────────────

// GET /api/dashboard
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const userId = getAuthUserId(req);

  try {
    // Run all queries in parallel for maximum performance
    const [summaryResult, recentTxResult, billsResult, goalsResult, profileResult] = await Promise.allSettled([
      supabase.from('dashboard_summary').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(5),
      supabase.from('bills').select('*').eq('user_id', userId).eq('is_paid', false).order('due_date', { ascending: true }),
      supabase.from('goals').select('*').eq('user_id', userId).eq('status', 'active'),
      supabase.from('user_financial_profiles').select('credit_score, spending_personality, savings_rate').eq('user_id', userId).maybeSingle(),
    ]);

    const summary = summaryResult.status === 'fulfilled' ? summaryResult.value.data : null;
    const recentTx = recentTxResult.status === 'fulfilled' ? recentTxResult.value.data : [];
    const bills = billsResult.status === 'fulfilled' ? billsResult.value.data : [];
    const goals = goalsResult.status === 'fulfilled' ? goalsResult.value.data : [];
    const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;

    const today = new Date().toISOString().split('T')[0];
    const overdueBills = (bills || []).filter(b => b.due_date < today);

    res.json({
      balance: summary?.net_balance ? Number(summary.net_balance) : 0,
      income: summary?.total_income ? Number(summary.total_income) : 0,
      expenses: summary?.total_expenses ? Number(summary.total_expenses) : 0,
      spendingThisMonth: summary?.spending_this_month ? Number(summary.spending_this_month) : 0,
      spendingThisWeek: summary?.spending_this_week ? Number(summary.spending_this_week) : 0,
      transactionsThisMonth: summary?.transactions_this_month || 0,
      recentTransactions: recentTx || [],
      creditScore: profile?.credit_score || null,
      spendingPersonality: profile?.spending_personality || null,
      savingsRate: profile?.savings_rate ? Number(profile.savings_rate) : null,
      bills: {
        totalDue: (bills || []).reduce((s, b) => s + Number(b.amount), 0),
        unpaidCount: (bills || []).length,
        overdueCount: overdueBills.length,
        upcoming: (bills || []).slice(0, 3),
      },
      goals: {
        activeCount: (goals || []).length,
        totalTarget: (goals || []).reduce((s, g) => s + Number(g.target_amount), 0),
        totalSaved: (goals || []).reduce((s, g) => s + Number(g.current_amount), 0),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard data', detail: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const providers = [];
  if (GROQ_API_KEY) providers.push(`Groq/Llama 3.3 (${LLAMA_MODEL})`);
  if (GEMINI_API_KEY) providers.push(`Gemini (${GEMINI_MODEL})`);
  if (providers.length > 0) {
    console.log(`FlowMint AI: ✅ Providers: ${providers.join(' → ')}`);
    console.log(`FlowMint AI: 🆓 FREE for all users — no usage limits`);
    console.log(`FlowMint AI: 🔄 Fallback chain: ${providers.join(' → ')} → Math`);
  } else {
    console.log(`FlowMint AI: ⚠️  No AI keys set — all routes will use fallback math`);
  }
});
