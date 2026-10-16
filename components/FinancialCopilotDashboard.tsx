import { useEffect, useState } from 'react';
import { ArrowRight, Brain, Loader2, Receipt, Target } from 'lucide-react';
import { financialProfileService, transactionService, type FinancialProfile } from '../services/apiService';
import { llmService } from '../services/llmService';
import type { Transaction } from '../types';

interface DashboardProps {
  userProfile?: { name: string; email: string; avatar: string } | null;
  onNavigate?: (tab: string) => void;
}

const formatMoney = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const FinancialCopilotDashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate }) => {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [financialProfile, recentTransactions] = await Promise.all([
          financialProfileService.get(),
          transactionService.getRecent(5),
        ]);
        if (!active) return;
        setProfile(financialProfile);
        setTransactions(recentTransactions);
        if (financialProfile) {
          const result = await llmService.getSpendingInsight({});
          if (!active) return;
          setInsight(result.tip ? `${result.personality}: ${result.tip}` : '');
        }
      } catch (loadError) {
        console.error('Unable to load FlowMint dashboard:', loadError);
        if (active) setError('We could not load your financial information. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadDashboard();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center" aria-label="Loading financial overview"><Loader2 className="h-7 w-7 animate-spin text-brand" /></div>;
  }

  if (error) {
    return <p role="alert" className="rounded-2xl border border-red-500/30 p-5 text-sm text-red-400">{error}</p>;
  }

  const income = Number(profile?.monthly_income ?? 0);
  const expenses = Number(profile?.monthly_expenses ?? 0);
  const rentEmi = Number(profile?.monthly_rent_emi ?? 0);
  const savings = Number(profile?.current_savings ?? 0);
  const surplus = income - expenses - rentEmi;
  const firstName = userProfile?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Your AI Financial Copilot</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>Good to see you, {firstName} 👋</h1>
        <p className="mt-2 text-sm text-gray-500">Understand → Plan → Save → Decide</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Your financial overview">
        <SummaryCard label="Monthly income" amount={income} />
        <SummaryCard label="Monthly expenses" amount={expenses} />
        <SummaryCard label="Current savings" amount={savings} />
        <SummaryCard label="Rent / EMI" amount={rentEmi} />
      </section>

      <section className="glass rounded-3xl border p-6" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2 text-brand">
          <Brain className="h-5 w-5" />
          <h2 className="text-sm font-black uppercase tracking-widest">AI insight</h2>
        </div>
        {insight ? (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-color)' }}>{insight}</p>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Add expense records to get an insight based on your activity.</p>
        )}
        <button onClick={() => onNavigate?.('ai')} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand">
          Ask FlowMint <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="glass rounded-3xl border p-6" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Monthly plan</p>
            <h2 className="mt-2 text-lg font-black" style={{ color: 'var(--text-color)' }}>Potential monthly surplus</h2>
          </div>
          <p className={`text-xl font-black ${surplus < 0 ? 'text-red-400' : 'text-brand'}`}>{formatMoney(surplus)}</p>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          Calculated from the income, expense, and rent/EMI figures you provided. This is a planning estimate, not a bank balance.
        </p>
        <button onClick={() => onNavigate?.('goals')} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand">
          Plan a savings goal <Target className="h-4 w-4" />
        </button>
      </section>

      <section className="glass rounded-3xl border p-6" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand" />
            <h2 className="font-black" style={{ color: 'var(--text-color)' }}>Recent expense records</h2>
          </div>
          <button onClick={() => onNavigate?.('expenses')} className="text-xs font-black text-brand">View expenses</button>
        </div>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No expense records yet. Add your first expense to start tracking.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>{transaction.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{transaction.category} · {new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-black" style={{ color: 'var(--text-color)' }}>
                  {transaction.type === 'income' ? '+' : '−'}{formatMoney(Number(transaction.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; amount: number }> = ({ label, amount }) => (
  <div className="glass rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)' }}>
    <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</p>
    <p className="mt-2 text-lg font-black" style={{ color: 'var(--text-color)' }}>{formatMoney(amount)}</p>
  </div>
);

export default FinancialCopilotDashboard;
