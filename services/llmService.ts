
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
import { supabase } from './supabase';

const API_BASE = `${getApiBase()}/api/ai`;

// ─── Helper ───────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in to use FlowMint AI.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();

  // Add timeout to prevent hanging when backend is sleeping (Render free tier)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(url, {
      ...options,
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
    return apiCall<WishPlanResponse>(`${API_BASE}/wish-plan`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Generate AI spending insights from transaction data.
   */
  async getSpendingInsight(request: SpendingInsightRequest): Promise<SpendingInsightResponse> {
    return apiCall<SpendingInsightResponse>(`${API_BASE}/spending-insight`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * General-purpose financial chat — ask anything.
   * Uses the authenticated AI backend; provider failures are returned to the caller.
   */
  async chatWithAI(message: string): Promise<ChatResponse> {
    return apiCall<ChatResponse>(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
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
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (bookmarked) params.set('bookmarked', 'true');
    return apiCall<ConversationHistory>(`${API_BASE}/history?${params}`);
  },

  /**
   * Get a single conversation with full details.
   */
  async getConversation(id: string): Promise<ConversationSummary | null> {
    return apiCall<ConversationSummary>(`${API_BASE}/conversations/${id}`);
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
    return apiCall<FinancialProfile>(`${API_BASE}/profile`);
  },
};
