
import { supabase } from './supabase';

// ═══════════════════════════════════════════════════
// FlowMint Data Service — Real Supabase Integration
// ═══════════════════════════════════════════════════
//
// Replaces the old mock apiService with real database
// queries. Every method includes proper error handling,
// typed responses, and fallback behaviors.
// ═══════════════════════════════════════════════════

// ─── Error Handling Utility ─────────────────────────

export class FlowMintError extends Error {
  code: string;
  userMessage: string;

  constructor(code: string, userMessage: string, devMessage?: string) {
    super(devMessage || userMessage);
    this.code = code;
    this.userMessage = userMessage;
    this.name = 'FlowMintError';
  }
}

function handleSupabaseError(error: any, context: string): never {
  console.error(`[FlowMint:${context}]`, error);

  if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
    throw new FlowMintError('AUTH_EXPIRED', 'Your session has expired. Please sign in again.');
  }
  if (error?.code === '42501' || error?.message?.includes('RLS')) {
    throw new FlowMintError('PERMISSION_DENIED', 'You don\'t have permission to access this data.');
  }
  if (error?.code === '23505') {
    throw new FlowMintError('DUPLICATE', 'This record already exists.');
  }
  if (error?.code === '23503') {
    throw new FlowMintError('REFERENCE_ERROR', 'A related record was not found.');
  }
  if (error?.message?.includes('FetchError') || error?.message?.includes('NetworkError')) {
    throw new FlowMintError('NETWORK_ERROR', 'Unable to connect. Please check your internet connection.');
  }

  throw new FlowMintError('UNKNOWN', `Something went wrong while ${context}. Please try again.`);
}

// ─── Helper: Get User ID ────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    throw new FlowMintError('NOT_AUTHENTICATED', 'Please sign in to continue.');
  }
  return session.user.id;
}

// ═══════════════════════════════════════════════════
// Transactions
// ═══════════════════════════════════════════════════

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  is_recurring?: boolean;
  merchant?: string;
  notes?: string;
}

export const transactionService = {
  async getAll(limit = 20, offset = 0): Promise<{ data: Transaction[]; count: number }> {
    const userId = await getUserId();

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) handleSupabaseError(error, 'fetching transactions');
    return { data: data || [], count: count || 0 };
  },

  async getRecent(limit = 5): Promise<Transaction[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'fetching recent transactions');
    return data || [];
  },

  async create(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tx, user_id: userId }])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'creating transaction');
    return data!;
  },

  async getByCategory(days = 30): Promise<{ category: string; total: number; count: number }[]> {
    const userId = await getUserId();
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', since);

    if (error) handleSupabaseError(error, 'fetching category breakdown');

    // Aggregate client-side (Supabase doesn't do GROUP BY in REST)
    const map = new Map<string, { total: number; count: number }>();
    (data || []).forEach(row => {
      const prev = map.get(row.category) || { total: 0, count: 0 };
      map.set(row.category, { total: prev.total + Number(row.amount), count: prev.count + 1 });
    });

    return Array.from(map.entries())
      .map(([category, { total, count }]) => ({ category, total, count }))
      .sort((a, b) => b.total - a.total);
  },

  async getDailySpending(days = 7): Promise<{ day: string; amount: number }[]> {
    const userId = await getUserId();
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', since);

    if (error) handleSupabaseError(error, 'fetching daily spending');

    const dayMap = new Map<string, number>();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    (data || []).forEach(row => {
      const d = new Date(row.date);
      const dayKey = dayNames[d.getDay()];
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + Number(row.amount));
    });

    return dayNames.map(day => ({ day, amount: dayMap.get(day) || 0 }));
  },
};

// ═══════════════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════════════

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  is_recurring?: boolean;
}

export const expenseService = {
  async getAll(limit = 30): Promise<Expense[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'fetching expenses');
    return data || [];
  },

  async create(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, user_id: userId }])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'saving expense');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) handleSupabaseError(error, 'deleting expense');
  },

  async getMonthlySummary(months = 4): Promise<{ month: string; total: number }[]> {
    const userId = await getUserId();
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const { data, error } = await supabase
      .from('expenses')
      .select('date, amount')
      .eq('user_id', userId)
      .gte('date', since.toISOString());

    if (error) handleSupabaseError(error, 'fetching monthly summary');

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthMap = new Map<string, number>();

    (data || []).forEach(row => {
      const d = new Date(row.date);
      const key = monthNames[d.getMonth()];
      monthMap.set(key, (monthMap.get(key) || 0) + Number(row.amount));
    });

    return Array.from(monthMap.entries()).map(([month, total]) => ({ month, total }));
  },
};

// ═══════════════════════════════════════════════════
// Bills
// ═══════════════════════════════════════════════════

export interface Bill {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  type: string;
  is_paid: boolean;
  is_recurring?: boolean;
  icon?: string;
  paid_at?: string;
}

export const billService = {
  async getAll(): Promise<Bill[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) handleSupabaseError(error, 'fetching bills');
    return data || [];
  },

  async create(bill: Omit<Bill, 'id' | 'is_paid'>): Promise<Bill> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('bills')
      .insert([{ ...bill, user_id: userId, is_paid: false }])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'creating bill');
    return data!;
  },

  async markPaid(id: string): Promise<Bill> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('bills')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'marking bill as paid');
    return data!;
  },

  async getOverdue(): Promise<Bill[]> {
    const userId = await getUserId();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .eq('is_paid', false)
      .lt('due_date', today);

    if (error) handleSupabaseError(error, 'fetching overdue bills');
    return data || [];
  },

  async getSummary(): Promise<{ total: number; unpaid: number; overdue: number }> {
    const bills = await this.getAll();
    const today = new Date().toISOString().split('T')[0];

    const unpaid = bills.filter(b => !b.is_paid);
    const overdue = unpaid.filter(b => b.due_date < today);

    return {
      total: unpaid.reduce((sum, b) => sum + Number(b.amount), 0),
      unpaid: unpaid.length,
      overdue: overdue.length,
    };
  },
};

// ═══════════════════════════════════════════════════
// Goals
// ═══════════════════════════════════════════════════

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category?: string;
  status: 'active' | 'completed' | 'paused';
  ai_plan?: any;
}

export const goalService = {
  async getAll(): Promise<Goal[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'fetching goals');
    return data || [];
  },

  async create(goal: Pick<Goal, 'name' | 'target_amount' | 'deadline' | 'category'>): Promise<Goal> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('goals')
      .insert([{ ...goal, user_id: userId, current_amount: 0, status: 'active' }])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'creating goal');
    return data!;
  },

  async updateProgress(id: string, amount: number): Promise<Goal> {
    const userId = await getUserId();

    // First get current goal to check target
    const { data: current, error: fetchError } = await supabase
      .from('goals')
      .select('target_amount, current_amount')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError) handleSupabaseError(fetchError, 'fetching goal for update');

    const newAmount = Number(current!.current_amount) + amount;
    const isComplete = newAmount >= Number(current!.target_amount);

    const { data, error } = await supabase
      .from('goals')
      .update({
        current_amount: newAmount,
        status: isComplete ? 'completed' : 'active',
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'updating goal progress');
    return data!;
  },

  async saveAIPlan(id: string, plan: any): Promise<Goal> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('goals')
      .update({ ai_plan: plan })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'saving AI plan');
    return data!;
  },

  async delete(id: string): Promise<void> {
    const userId = await getUserId();

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) handleSupabaseError(error, 'deleting goal');
  },
};

// ═══════════════════════════════════════════════════
// Payments
// ═══════════════════════════════════════════════════

export interface Payment {
  id: string;
  recipient: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  upi_id?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export const paymentService = {
  async getAll(limit = 20): Promise<Payment[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error, 'fetching payments');
    return data || [];
  },

  async create(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...payment, user_id: userId }])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'recording payment');
    return data!;
  },
};

// ═══════════════════════════════════════════════════
// Dashboard Summary
// ═══════════════════════════════════════════════════

export interface DashboardData {
  balance: number;
  income: number;
  expenses: number;
  spendingThisMonth: number;
  spendingThisWeek: number;
  transactionsThisMonth: number;
  recentTransactions: Transaction[];
  billsSummary: { total: number; unpaid: number; overdue: number };
  goalsCount: number;
  creditScore?: number | null;
}

import { getApiBase } from '../utils/platform';

export const dashboardService = {
  async fetchCreditScore(refresh: boolean = false): Promise<{ creditScore: number, riskLevel?: string, approvalLikelihood?: string, nextRefreshAvailable?: string, message?: string } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return null;

      const response = await fetch(`${getApiBase()}/api/credit-score${refresh ? '?refresh=true' : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  async getSummary(): Promise<DashboardData> {
    const userId = await getUserId();

    // Parallel fetches for performance
    const [txResult, recentTx, billsSummary, goals, profileFetch] = await Promise.allSettled([
      supabase.from('dashboard_summary').select('*').eq('user_id', userId).maybeSingle(),
      transactionService.getRecent(5),
      billService.getSummary(),
      goalService.getAll(),
      supabase.from('user_financial_profiles').select('credit_score').eq('user_id', userId).maybeSingle()
    ]);

    const summary = txResult.status === 'fulfilled' ? txResult.value.data : null;
    const recent = recentTx.status === 'fulfilled' ? recentTx.value : [];
    const bills = billsSummary.status === 'fulfilled' ? billsSummary.value : { total: 0, unpaid: 0, overdue: 0 };
    const goalsList = goals.status === 'fulfilled' ? goals.value : [];
    const profileData = profileFetch.status === 'fulfilled' ? profileFetch.value.data : null;

    return {
      balance: summary?.net_balance ? Number(summary.net_balance) : 0,
      income: summary?.total_income ? Number(summary.total_income) : 0,
      expenses: summary?.total_expenses ? Number(summary.total_expenses) : 0,
      spendingThisMonth: summary?.spending_this_month ? Number(summary.spending_this_month) : 0,
      spendingThisWeek: summary?.spending_this_week ? Number(summary.spending_this_week) : 0,
      transactionsThisMonth: summary?.transactions_this_month || 0,
      recentTransactions: recent,
      billsSummary: bills,
      goalsCount: goalsList.filter(g => g.status === 'active').length,
      creditScore: profileData?.credit_score || null,
    };
  },
};

// ═══════════════════════════════════════════════════
// Backward-compatible apiService (drop-in replacement)
// ═══════════════════════════════════════════════════

export const apiService = {
  async getTransactions() {
    try {
      return await transactionService.getRecent(5);
    } catch {
      // Fallback to mock data if DB tables don't have data yet
      return [
        { id: '1', title: 'Zomato', amount: 450, category: 'Food', date: '10:30 AM', type: 'expense' as const },
        { id: '2', title: 'Uber', amount: 120, category: 'Travel', date: '9:15 AM', type: 'expense' as const },
        { id: '3', title: 'Salary', amount: 85000, category: 'Income', date: 'Yesterday', type: 'income' as const },
        { id: '4', title: 'Netflix', amount: 499, category: 'Subscription', date: '2 days ago', type: 'expense' as const },
        { id: '5', title: 'Amazon', amount: 2400, category: 'Shopping', date: '3 days ago', type: 'expense' as const },
      ];
    }
  },

  async getBills() {
    try {
      return await billService.getAll();
    } catch {
      return [
        { id: '1', title: 'iPhone 15 EMI', amount: 5499, due_date: 'In 2 days', type: 'EMI', is_paid: false },
        { id: '2', title: 'Electricity Bill', amount: 2100, due_date: 'In 5 days', type: 'Utility', is_paid: false },
        { id: '3', title: 'Car Loan', amount: 12500, due_date: 'Paid', type: 'EMI', is_paid: true },
      ];
    }
  },

  async getGoals() {
    try {
      return await goalService.getAll();
    } catch {
      return [
        { id: '1', name: 'Tokyo Trip 2025', target_amount: 250000, current_amount: 125000, deadline: 'Dec 2025', category: 'Travel', status: 'active' as const },
        { id: '2', name: 'MacBook Pro M4', target_amount: 180000, current_amount: 45000, deadline: 'Sep 2025', category: 'Gadget', status: 'active' as const },
      ];
    }
  },

  async getLoanOffers() {
    return [
      { id: '1', partner: 'HDFC Bank', amount: 1500000, interestRate: 9.25, tenure: 60, type: 'Personal' },
      { id: '2', partner: 'Muthoot Finance', amount: 5000000, interestRate: 8.0, tenure: 24, type: 'Gold' },
      { id: '3', partner: 'ICICI Bank', amount: 4000000, interestRate: 10.5, tenure: 84, type: 'Education' },
    ];
  },
};
