
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
}

export interface Bill {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid';
  type: 'EMI' | 'Subscription' | 'Utility';
}

export interface WishGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'Travel' | 'Gadget' | 'Vehicle' | 'Education';
}

export interface LoanOffer {
  id: string;
  partner: string;
  amount: number;
  interestRate: number;
  tenure: number;
  type: 'Personal' | 'Gold' | 'Education';
}
