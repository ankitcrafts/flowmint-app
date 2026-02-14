
import { Transaction, Bill, WishGoal, LoanOffer } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  async getTransactions(): Promise<Transaction[]> {
    await delay(800);
    return [
      { id: '1', title: 'Zomato', amount: 450, category: 'Food', date: '10:30 AM', type: 'expense' },
      { id: '2', title: 'Uber', amount: 120, category: 'Travel', date: '9:15 AM', type: 'expense' },
      { id: '3', title: 'Salary', amount: 85000, category: 'Income', date: 'Yesterday', type: 'income' },
      { id: '4', title: 'Netflix', amount: 499, category: 'Subscription', date: '2 days ago', type: 'expense' },
      { id: '5', title: 'Amazon', amount: 2400, category: 'Shopping', date: '3 days ago', type: 'expense' },
    ];
  },

  async getBills(): Promise<Bill[]> {
    await delay(600);
    return [
      { id: '1', title: 'iPhone 15 EMI', amount: 5499, dueDate: 'In 2 days', status: 'pending', type: 'EMI' },
      { id: '2', title: 'Electricity Bill', amount: 2100, dueDate: 'In 5 days', status: 'pending', type: 'Utility' },
      { id: '3', title: 'Car Loan', amount: 12500, dueDate: 'Paid', status: 'paid', type: 'EMI' },
    ];
  },

  async getGoals(): Promise<WishGoal[]> {
    await delay(700);
    return [
      { id: '1', name: 'Tokyo Trip 2025', targetAmount: 250000, currentAmount: 125000, deadline: 'Dec 2025', category: 'Travel' },
      { id: '2', name: 'MacBook Pro M4', targetAmount: 180000, currentAmount: 45000, deadline: 'Sep 2025', category: 'Gadget' },
    ];
  },

  async getLoanOffers(): Promise<LoanOffer[]> {
    await delay(900);
    return [
      { id: '1', partner: 'HDFC Bank', amount: 1500000, interestRate: 9.25, tenure: 60, type: 'Personal' },
      { id: '2', partner: 'Muthoot Finance', amount: 5000000, interestRate: 8.0, tenure: 24, type: 'Gold' },
      { id: '3', partner: 'ICICI Bank', amount: 4000000, interestRate: 10.5, tenure: 84, type: 'Education' },
    ];
  }
};
