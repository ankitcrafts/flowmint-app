import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine env file based on environment
const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? '../.env.production' : '../.env.local');
dotenv.config({ path: envPath });
// Also load default .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',
    'http://localhost:3000',
    'capacitor://localhost',       // Capacitor Android
    'ionic://localhost',           // Ionic WebView
    'https://localhost',           // Capacitor iOS
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Initialize Supabase Client (Service Role)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Allow VITE prefix fallback for hybrid dev
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-replace-in-prod';

// Groq API (Llama 3.3 70B) — Primary AI provider
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.FLOWMINT_AI_BASE_URL || 'https://api.groq.com/openai/v1';
const LLAMA_MODEL = process.env.FLOWMINT_AI_MODEL || 'llama-3.3-70b-versatile';

// Google Gemini — Fallback AI provider (when Groq rate-limits)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Auth Middleware — supports JWT cookie + Supabase Bearer token
const authenticateToken = async (req, res, next) => {
  // Strategy 1: Express JWT from cookie (web, after /auth/google)
  const cookieToken = req.cookies.access_token;
  if (cookieToken) {
    try {
      const user = jwt.verify(cookieToken, JWT_SECRET);
      req.user = user;
      return next();
    } catch (err) {
      // Cookie token invalid — fall through to other strategies
    }
  }

  // Strategy 2: Supabase Bearer token (from Supabase Auth session)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const supabaseToken = authHeader.slice(7);
    try {
      // Verify with Supabase — get user from token
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
    } catch (err) {
      // Supabase token invalid — fall through
    }
  }

  // No valid auth found
  return res.status(401).json({ error: 'Please sign in to use FlowMint AI' });
};

/* --- Routes --- */

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

    // 3. Create JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Set HttpOnly Cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 3600000 // 1 hour
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

     // 2. Create JWT
     const accessToken = jwt.sign(
       { id: user.id, mobile: user.mobile },
       JWT_SECRET,
       { expiresIn: '1h' }
     );

     // 3. Set Cookie
     res.cookie('access_token', accessToken, {
       httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
       maxAge: 3600000
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

// Logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('access_token');
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

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
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
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errBody}`);
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

  const response = await fetch(
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
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
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
    console.error('Conversation save error:', error);
  }

  // 2. Update the user's financial profile (build it over time)
  if (type === 'wish_plan' && inputContext) {
    await updateFinancialProfile(userId, inputContext);
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

  const {
    wishName,
    price,
    currentSavings,
    monthlyIncome = 50000,
    monthlyExpenses = 30000,
    existingEMIs = 0,
    topSpendingCategories = [],
  } = req.body;

  if (!wishName || !price) {
    return res.status(400).json({ error: 'Missing wishName or price' });
  }

  const inputContext = { wishName, price, currentSavings, monthlyIncome, monthlyExpenses, existingEMIs, topSpendingCategories };

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

  const userPrompt = `I want to buy "${wishName}" costing ₹${price.toLocaleString('en-IN')}.
I have ₹${currentSavings.toLocaleString('en-IN')} saved so far (${Math.round((currentSavings / price) * 100)}% progress).

My financial profile:
- Monthly income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Monthly expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Existing EMIs: ₹${existingEMIs.toLocaleString('en-IN')}
- Monthly surplus: ₹${(monthlyIncome - monthlyExpenses - existingEMIs).toLocaleString('en-IN')}
${topSpendingCategories.length > 0 ? `- Top spending categories: ${topSpendingCategories.join(', ')}` : ''}

Create a realistic, actionable saving plan.`;

  try {
    const { content: rawResponse, tokens, responseTimeMs, provider, model } = await callAI(systemPrompt, userPrompt);
    const plan = JSON.parse(rawResponse);

    const result = {
      aiTip: plan.aiTip || `You can afford "${wishName}" in approximately ${Math.ceil((price - currentSavings) / ((monthlyIncome - monthlyExpenses - existingEMIs) * 0.7))} months.`,
      speedUpTip: plan.speedUpTip || 'Cut discretionary spending by 15% to speed up your goal.',
      monthsToAfford: plan.monthsToAfford || Math.ceil((price - currentSavings) / ((monthlyIncome - monthlyExpenses - existingEMIs) * 0.7)),
      savingSteps: Array.isArray(plan.savingSteps) ? plan.savingSteps.slice(0, 5) : [
        'Set up auto-transfer on salary day',
        'Reduce food delivery orders',
        'Audit and cancel unused subscriptions',
      ],
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
    console.error('FlowMint AI — Wish Plan Error:', error.message);

    // Fallback: math-based plan (still save as conversation)
    const surplus = monthlyIncome - monthlyExpenses - existingEMIs;
    const saveable = Math.round(surplus * 0.7);
    const remaining = price - currentSavings;
    const months = Math.max(1, Math.ceil(remaining / saveable));

    const fallbackResult = {
      aiTip: `At ₹${saveable.toLocaleString('en-IN')}/month savings, you can afford "${wishName}" in ~${months} months.`,
      speedUpTip: 'Cut food delivery and subscriptions by 20% to reach your goal faster.',
      monthsToAfford: months,
      savingSteps: [
        `Auto-save ₹${saveable.toLocaleString('en-IN')}/month into a liquid fund`,
        'Reduce Swiggy/Zomato orders by 2-3 per week',
        'Switch annual plans for Netflix, Spotify, YouTube Premium',
      ],
    };

    // Save fallback conversation too (useful for tracking failure rates)
    const conversation = await saveConversation(userId, {
      type: 'wish_plan',
      title: `${wishName} — Saving Plan`,
      inputContext,
      aiResponse: fallbackResult,
      modelUsed: 'fallback-math',
      provider: 'local',
      responseTimeMs: 0,
      tokensUsed: 0,
    });

    // await incrementUsage(userId, 'wish_plans', 0);

    res.json({
      ...fallbackResult,
      conversationId: conversation?.id,
      provider: 'local',
      model: 'fallback-math',
      fallback: true,
    });
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

  const { transactions = [], creditScore, monthlyIncome, totalBalance, activeEMIs } = req.body;

  const systemPrompt = `You are FlowMint AI, a witty financial advisor for Indian millennials.

Analyze the user's spending data and return a JSON response with:
{
  "personality": "A fun 2-3 word spending personality label (e.g., 'The Strategic Saver', 'The Weekend Warrior', 'The Subscription King')",
  "tip": "One sharp, actionable financial tip in 1-2 sentences. Reference specific patterns you see in their data. Use Indian context."
}

RESPOND ONLY with valid JSON.`;

  const txSummary = transactions.length > 0
    ? `Recent transactions:\n${transactions.slice(0, 15).map(t => `- ${t.title}: ₹${t.amount} (${t.category}, ${t.type})`).join('\n')}`
    : 'No transaction data available.';

  const userPrompt = `${txSummary}

Financial snapshot:
- Total balance: ₹${(totalBalance || 0).toLocaleString('en-IN')}
- Credit score: ${creditScore || 'Unknown'}
- Monthly income: ₹${(monthlyIncome || 0).toLocaleString('en-IN')}
- Active EMIs: ${activeEMIs || 0}

What's my spending personality and one tip to improve?`;

  const inputContext = { transactions: transactions.slice(0, 15), creditScore, monthlyIncome, totalBalance, activeEMIs };

  try {
    const { content: rawResponse, tokens, responseTimeMs, provider, model } = await callAI(systemPrompt, userPrompt, 256);
    const insight = JSON.parse(rawResponse);

    const result = {
      personality: insight.personality || 'The Balanced One',
      tip: insight.tip || 'Keep tracking — awareness is the first step to wealth!',
    };

    // Save conversation
    const conversation = await saveConversation(userId, {
      type: 'spending_insight',
      title: `Spending Analysis — ${result.personality}`,
      inputContext,
      aiResponse: result,
      responseTimeMs,
      tokensUsed: tokens,
    });

    // Update financial profile with personality
    if (result.personality) {
      await supabase
        .from('user_financial_profiles')
        .upsert({
          user_id: userId,
          spending_personality: result.personality,
          credit_score: creditScore || undefined,
          last_ai_interaction: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    // await incrementUsage(userId, 'spending_insights', tokens);

    res.json({ ...result, conversationId: conversation?.id, provider, model });
  } catch (error) {
    console.error('FlowMint AI — Insight Error:', error.message);
    res.json({
      personality: 'The Balanced One',
      tip: 'Your spending is on track. Keep building that emergency fund — aim for 6 months of expenses!',
    });
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
