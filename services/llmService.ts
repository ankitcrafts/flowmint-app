
/**
 * FlowMint LLM Service
 * 
 * Frontend service for FlowMint AI — powered by Llama 3.3 (via Groq).
 * All AI calls are proxied through the Express backend, which handles:
 *   • API key security (never exposed to frontend)
 *   • Conversation storage in Supabase
 *   • Financial profile building
 *   • Training data queue
 *   • Usage tracking (currently disabled — free for all users)
 * 
 * Future: Backend will swap Groq → self-hosted FlowMint AI (vLLM)
 *         Frontend stays the same — zero changes needed here.
 */

// ─── Types ────────────────────────────────────────────────

export interface WishPlanRequest {
  wishName: string;
  price: number;
  currentSavings: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  existingEMIs?: number;
  topSpendingCategories?: string[];
}

export interface WishPlanResponse {
  aiTip: string;
  speedUpTip: string;
  monthsToAfford: number;
  savingSteps: string[];
  conversationId?: string;
  provider?: string;    // 'groq' | 'gemini' | 'local'
  model?: string;       // e.g. 'llama-3.3-70b-versatile' | 'gemini-2.0-flash'
  responseTimeMs?: number;
  fallback?: boolean;
}

export interface SpendingInsightRequest {
  transactions?: Array<{ title: string; amount: number; category: string; type: string }>;
  creditScore?: number;
  monthlyIncome?: number;
  totalBalance?: number;
  activeEMIs?: number;
}

export interface SpendingInsightResponse {
  personality: string;
  tip: string;
  conversationId?: string;
  provider?: string;
  model?: string;
}

export interface UsageInfo {
  tier: string;
  today: {
    wish_plans: { used: number; limit: number };
    spending_insights: { used: number; limit: number };
    chat_messages: { used: number; limit: number };
    total_tokens: number;
  };
  unlimited: boolean;
}

export interface ConversationSummary {
  id: string;
  type: string;
  title: string;
  status: string;
  input_context: Record<string, any>;
  ai_response: Record<string, any>;
  model_used: string;
  user_rating: number | null;
  is_bookmarked: boolean;
  created_at: string;
}

export interface ConversationHistory {
  conversations: ConversationSummary[];
  total: number | null;
  hasMore: boolean;
}

export interface FinancialProfile {
  exists: boolean;
  monthly_income?: number;
  monthly_expenses?: number;
  monthly_savings?: number;
  existing_emis?: number;
  top_spending_categories?: string[];
  credit_score?: number;
  savings_rate?: number;
  spending_personality?: string;
  profile_completeness?: number;
  total_ai_interactions?: number;
  last_ai_interaction?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
  category: string;
  actionable: boolean;
  followUp?: string | null;
  conversationId?: string;
  provider?: string;
  model?: string;
  responseTimeMs?: number;
  fallback?: boolean;
}

// ─── Configuration ────────────────────────────────────────

import { getApiBase } from '../utils/platform';

const API_BASE = `${getApiBase()}/api/ai`;

// ─── Helper ───────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    // Import supabase dynamically to avoid circular deps
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // No supabase session available — will rely on cookie auth
  }

  return headers;
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();

  // Add timeout to prevent hanging when backend is sleeping (Render free tier)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Also send cookies for JWT auth
      signal: controller.signal,
      headers: {
        ...authHeaders,
        ...(options?.headers instanceof Headers 
          ? Object.fromEntries(options.headers.entries()) 
          : options?.headers as Record<string, string>),
      },
    });

    if (response.status === 401) {
      console.warn('FlowMint Auth: 401 received — token present:', !!authHeaders['Authorization']);
      throw new Error('Please sign in to use FlowMint AI');
    }

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Custom Error for Rate Limits (COMMENTED OUT — free for all users) ──
// Uncomment when ready to monetize:
//
// export class LimitReachedError extends Error {
//   usage: number;
//   limit: number;
//   tier: string;
//   constructor(message: string, usage: number, limit: number, tier: string) {
//     super(message);
//     this.name = 'LimitReachedError';
//     this.usage = usage;
//     this.limit = limit;
//     this.tier = tier;
//   }
// }

// ─── Main Service ─────────────────────────────────────────

export const llmService = {

  // ── AI Generation ──────────────────────────────────────

  /**
   * Generate an AI-powered saving plan for a wish/goal.
   * Automatically saved to conversation history on the backend.
   */
  async getWishPlan(request: WishPlanRequest): Promise<WishPlanResponse> {
    try {
      return await apiCall<WishPlanResponse>(`${API_BASE}/wish-plan`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('FlowMint AI — Wish Plan Error:', error);
      return this._fallbackWishPlan(request);
    }
  },

  /**
   * Generate AI spending insights from transaction data.
   */
  async getSpendingInsight(request: SpendingInsightRequest): Promise<SpendingInsightResponse> {
    try {
      return await apiCall<SpendingInsightResponse>(`${API_BASE}/spending-insight`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('FlowMint AI — Insight Error:', error);
      return {
        personality: 'The Balanced One',
        tip: 'Keep tracking your spending — your financial awareness is already a superpower!',
      };
    }
  },

  /**
   * General-purpose financial chat — ask anything.
   * Uses the real AI backend (Groq/Gemini) first.
   * If the backend is unreachable (Render sleeping), falls back to direct Gemini API call.
   */
  async chatWithAI(message: string): Promise<ChatResponse> {
    // 1. Try backend API first (Groq → Gemini on server)
    try {
      return await apiCall<ChatResponse>(`${API_BASE}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    } catch (backendError) {
      console.warn('FlowMint AI — Backend unreachable, trying direct Gemini:', backendError);
    }

    // 2. Fallback: Call Gemini directly from the frontend
    try {
      return await this._directGeminiChat(message);
    } catch (geminiError) {
      console.error('FlowMint AI — Direct Gemini also failed:', geminiError);
    }

    // 3. Final fallback: static response
    return {
      reply: "I'm having a brief moment — but here's a universal tip: automate ₹5,000/month into a liquid fund on salary day. Small steps build serious wealth! Try again in a moment 💪",
      category: 'general',
      actionable: true,
      followUp: 'Want me to help analyze your spending or plan savings?',
      fallback: true,
    };
  },

  // ── Usage & Limits (DISABLED — free for all users) ────

  /**
   * Returns unlimited status — AI is free for all users.
   * Usage tracking disabled; uncomment when ready to monetize.
   */
  async getUsage(): Promise<UsageInfo> {
    return {
      tier: 'free',
      today: {
        wish_plans: { used: 0, limit: -1 },
        spending_insights: { used: 0, limit: -1 },
        chat_messages: { used: 0, limit: -1 },
        total_tokens: 0,
      },
      unlimited: true,
    };
  },

  // ── Conversation History ───────────────────────────────

  /**
   * Fetch past AI conversations.
   * @param type - Filter by type: 'wish_plan' | 'spending_insight' | 'chat'
   * @param limit - Number of conversations to fetch
   * @param offset - Pagination offset
   * @param bookmarked - Only show bookmarked conversations
   */
  async getHistory(
    type?: string,
    limit: number = 20,
    offset: number = 0,
    bookmarked: boolean = false,
  ): Promise<ConversationHistory> {
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (bookmarked) params.set('bookmarked', 'true');

      return await apiCall<ConversationHistory>(`${API_BASE}/history?${params}`);
    } catch {
      return { conversations: [], total: 0, hasMore: false };
    }
  },

  /**
   * Get a single conversation with full details.
   */
  async getConversation(id: string): Promise<ConversationSummary | null> {
    try {
      return await apiCall<ConversationSummary>(`${API_BASE}/conversations/${id}`);
    } catch {
      return null;
    }
  },

  // ── Ratings & Bookmarks ────────────────────────────────

  /**
   * Rate an AI response (1-5 stars).
   * Responses rated 4-5 are automatically queued for future LLM training.
   */
  async rateConversation(id: string, rating: number): Promise<void> {
    await apiCall(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ rating }),
    });
  },

  /**
   * Bookmark/unbookmark a conversation for easy reference.
   */
  async toggleBookmark(id: string, bookmarked: boolean): Promise<void> {
    await apiCall(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_bookmarked: bookmarked }),
    });
  },

  /**
   * Submit feedback text on an AI response.
   */
  async submitFeedback(id: string, feedback: string): Promise<void> {
    await apiCall(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ user_feedback: feedback }),
    });
  },

  // ── Financial Profile ──────────────────────────────────

  /**
   * Get the user's auto-built financial profile.
   * This profile is progressively built from AI interactions.
   */
  async getFinancialProfile(): Promise<FinancialProfile> {
    try {
      return await apiCall<FinancialProfile>(`${API_BASE}/profile`);
    } catch {
      return { exists: false, profile_completeness: 0 };
    }
  },

  // ── Direct Gemini Fallback (when backend is unreachable) ─

  /**
   * Call Gemini directly from the frontend when the backend server is down.
   * This ensures the AI chat always works, even when Render is sleeping.
   */
  async _directGeminiChat(message: string): Promise<ChatResponse> {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('No Gemini API key available for direct fallback');
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are FlowMint AI, a witty, knowledgeable financial advisor for Indian Gen-Z and Millennials.
Use Gen-Z lingo naturally (no cap, bet, vibe check, flex) but stay financially accurate.
Be direct, actionable, and conversational. Keep responses under 150 words.
Understand Indian financial products: SIP, PPF, FD, RD, UPI, EMI, CIBIL, NPS, ELSS, 80C, HRA.
All amounts in ₹ (Indian Rupees).

RESPOND ONLY with valid JSON:
{"reply": "your response", "category": "savings|spending|credit|loans|investing|tax|insurance|general", "actionable": true/false, "followUp": "optional follow-up question"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // If JSON parse fails, use the raw text as reply
      parsed = { reply: rawText, category: 'general', actionable: false };
    }

    return {
      reply: parsed.reply || rawText,
      category: parsed.category || 'general',
      actionable: parsed.actionable || false,
      followUp: parsed.followUp || null,
      provider: 'gemini-direct',
      model: 'gemini-2.5-flash',
    };
  },

  // ── Fallback ───────────────────────────────────────────

  /**
   * Fallback when AI service is completely unavailable.
   * Pure math — no API call needed.
   */
  _fallbackWishPlan(request: WishPlanRequest): WishPlanResponse {
    const income = request.monthlyIncome || 50000;
    const expenses = request.monthlyExpenses || 30000;
    const emis = request.existingEMIs || 0;
    const surplus = income - expenses - emis;
    const saveable = Math.round(surplus * 0.7);
    const remaining = request.price - request.currentSavings;
    const months = Math.max(1, Math.ceil(remaining / saveable));

    return {
      aiTip: `At ₹${saveable.toLocaleString()}/month savings rate, you can afford "${request.wishName}" in ~${months} months.`,
      speedUpTip: 'Try cutting discretionary spending by 15% — food delivery and subscriptions are the easiest wins.',
      monthsToAfford: months,
      savingSteps: [
        `Auto-save ₹${saveable.toLocaleString()}/month into a liquid fund on salary day`,
        'Reduce food delivery orders by 2-3 per week',
        'Audit subscriptions — cancel or switch to annual plans',
      ],
      fallback: true,
    };
  },
};
