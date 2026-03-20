
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income' | 'transfer';
  is_recurring?: boolean;
  merchant?: string;
  notes?: string;
}

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
  // Legacy compatibility
  dueDate?: string;
  status?: 'pending' | 'paid';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  is_recurring?: boolean;
}

export interface WishGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category?: string;
  status?: 'active' | 'completed' | 'paused';
  ai_plan?: any;
  // Legacy compatibility
  targetAmount?: number;
  currentAmount?: number;
}

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

export interface LoanOffer {
  id: string;
  partner: string;
  amount: number;
  interestRate: number;
  tenure: number;
  type: 'Personal' | 'Gold' | 'Education';
}

// Dashboard
export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
  spendingThisMonth: number;
  spendingThisWeek: number;
  transactionsThisMonth: number;
  recentTransactions: Transaction[];
  creditScore: number | null;
  spendingPersonality: string | null;
  savingsRate: number | null;
  bills: {
    totalDue: number;
    unpaidCount: number;
    overdueCount: number;
    upcoming: Bill[];
  };
  goals: {
    activeCount: number;
    totalTarget: number;
    totalSaved: number;
  };
}
