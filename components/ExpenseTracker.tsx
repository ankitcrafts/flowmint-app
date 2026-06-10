
import React, { useState, useMemo } from 'react';
import {
  Plus, Coffee, ShoppingBag, Car, Smartphone, Zap, Home, Utensils,
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw, ChevronRight,
  Calendar, Filter, Search, X, Sparkles, ArrowUpRight, BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  isRecurring: boolean;
  recurringTag?: string;
}

const CATEGORIES = [
  { name: 'Food', icon: Coffee, color: '#F97316' },
  { name: 'Shopping', icon: ShoppingBag, color: '#D4A017' },
  { name: 'Transport', icon: Car, color: '#3B82F6' },
  { name: 'Recharge', icon: Smartphone, color: '#10B981' },
  { name: 'Bills', icon: Zap, color: '#F59E0B' },
  { name: 'Rent', icon: Home, color: '#EF4444' },
  { name: 'Dining', icon: Utensils, color: '#EC4899' },
  { name: 'Other', icon: BarChart2, color: '#6B7280' },
];

const MOCK_EXPENSES: Expense[] = [
  { id: '1', title: 'Swiggy Order', amount: 456, category: 'Food', date: 'Today', isRecurring: false },
  { id: '2', title: 'Amazon Prime', amount: 1499, category: 'Shopping', date: 'Today', isRecurring: true, recurringTag: 'Monthly' },
  { id: '3', title: 'Uber Ride', amount: 234, category: 'Transport', date: 'Yesterday', isRecurring: false },
  { id: '4', title: 'Electricity Bill', amount: 2100, category: 'Bills', date: 'Yesterday', isRecurring: true, recurringTag: 'Monthly' },
  { id: '5', title: 'Jio Recharge', amount: 299, category: 'Recharge', date: '2 days ago', isRecurring: true, recurringTag: 'Monthly' },
  { id: '6', title: 'Zomato Gold', amount: 890, category: 'Dining', date: '2 days ago', isRecurring: false },
  { id: '7', title: 'House Rent', amount: 15000, category: 'Rent', date: '3 days ago', isRecurring: true, recurringTag: 'Monthly' },
  { id: '8', title: 'Chai Point', amount: 120, category: 'Food', date: '3 days ago', isRecurring: false },
  { id: '9', title: 'Netflix', amount: 649, category: 'Shopping', date: '4 days ago', isRecurring: true, recurringTag: 'Monthly' },
  { id: '10', title: 'Rapido Auto', amount: 89, category: 'Transport', date: '4 days ago', isRecurring: false },
];

const MONTHLY_DATA = [
  { month: 'Sep', amount: 32000 }, { month: 'Oct', amount: 28000 },
  { month: 'Nov', amount: 35000 }, { month: 'Dec', amount: 31000 },
];

const ExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'summary'>('list');

  // New expense form
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food');

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const recurringTotal = useMemo(() => expenses.filter(e => e.isRecurring).reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORIES.find(c => c.name === name)?.color || '#6B7280',
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Spending anomaly detection
  const anomalyAlert = useMemo(() => {
    const avgDaily = 31500 / 30; // ~1050 avg
    const todaySpend = expenses.filter(e => e.date === 'Today').reduce((s, e) => s + e.amount, 0);
    if (todaySpend > avgDaily * 1.8) {
      return `Today's spending (₹${todaySpend.toLocaleString()}) is ${Math.round((todaySpend / avgDaily - 1) * 100)}% above your daily average.`;
    }
    return null;
  }, [expenses]);

  // Smart category suggestion
  const suggestCategory = (title: string): string => {
    const lower = title.toLowerCase();
    if (/swiggy|zomato|food|chai|biryani|pizza/.test(lower)) return 'Food';
    if (/uber|ola|rapido|metro|petrol|fuel/.test(lower)) return 'Transport';
    if (/amazon|flipkart|myntra|netflix|spotify/.test(lower)) return 'Shopping';
    if (/jio|airtel|vi|bsnl/.test(lower)) return 'Recharge';
    if (/electric|water|gas|bill|wifi/.test(lower)) return 'Bills';
    if (/rent|maintenance|society/.test(lower)) return 'Rent';
    if (/restaurant|cafe|bar|pub/.test(lower)) return 'Dining';
    return 'Other';
  };

  const handleAddExpense = () => {
    if (!newTitle || !newAmount) return;
    const expense: Expense = {
      id: Date.now().toString(),
      title: newTitle,
      amount: parseInt(newAmount),
      category: newCategory,
      date: 'Today',
      isRecurring: false,
    };
    setExpenses([expense, ...expenses]);
    setNewTitle('');
    setNewAmount('');
    setNewCategory('Food');
    setShowAddModal(false);
  };

  const filteredExpenses = filterCategory
    ? expenses.filter(e => e.category === filterCategory)
    : expenses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Expenses</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Track every rupee</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-brand rounded-2xl text-black flex items-center justify-center shadow-lg theme-transition lg:hidden"
            style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Anomaly Alert */}
        {anomalyAlert && (
          <div className="glass rounded-2xl p-4 border border-orange-500/30 bg-orange-500/5 flex items-start gap-3 animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Spending Alert</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{anomalyAlert}</p>
            </div>
          </div>
        )}

        {/* Total Card */}
        <div className="glass rounded-[2.5rem] p-7 border theme-transition relative overflow-hidden"
          style={{ borderColor: 'var(--glass-border)' }}>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-brand/5 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">This Month</p>
              <h3 className="text-3xl font-black mt-2 tracking-tighter" style={{ color: 'var(--text-color)' }}>
                ₹{totalSpent.toLocaleString()}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <TrendingDown className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-black text-brand uppercase">8% less than Nov</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recurring</p>
              <p className="text-lg font-black mt-1" style={{ color: 'var(--text-color)' }}>₹{recurringTotal.toLocaleString()}</p>
              <div className="flex items-center gap-1 justify-end mt-1">
                <RefreshCw className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-black text-amber-500 uppercase">Auto-detected</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex p-1 rounded-2xl gap-1 theme-transition" style={{ backgroundColor: 'var(--card-subtle)' }}>
          <button
            onClick={() => setView('list')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
          >
            Transactions
          </button>
          <button
            onClick={() => setView('summary')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'summary' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
          >
            Summary
          </button>
        </div>

        {view === 'summary' ? (
          <div className="space-y-6">
            {/* Monthly Trend */}
            <div className="glass rounded-[2rem] p-6 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
              <h4 className="font-black text-sm mb-6 uppercase tracking-widest text-gray-500">Monthly Trend</h4>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DATA}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#6B7280' }} />
                    <Tooltip content={({ active, payload }: any) =>
                      active && payload?.length ? (
                        <div className="glass p-3 rounded-xl border" style={{ borderColor: 'var(--glass-border)' }}>
                          <p className="text-sm font-black" style={{ color: 'var(--text-color)' }}>₹{payload[0].value.toLocaleString()}</p>
                        </div>
                      ) : null
                    } />
                    <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={32}>
                      {MONTHLY_DATA.map((_, i) => (
                        <Cell key={i} fill={i === MONTHLY_DATA.length - 1 ? 'var(--brand-primary)' : 'var(--glass-border)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass rounded-[2rem] p-6 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
              <h4 className="font-black text-sm mb-6 uppercase tracking-widest text-gray-500">By Category</h4>
              <div className="space-y-4">
                {categoryBreakdown.map((cat) => {
                  const pct = Math.round((cat.value / totalSpent) * 100);
                  return (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                          <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-color)' }}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black" style={{ color: 'var(--text-color)' }}>₹{cat.value.toLocaleString()}</span>
                          <span className="text-[9px] font-black text-gray-500">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              <button
                onClick={() => setFilterCategory(null)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border theme-transition`}
                style={{
                  backgroundColor: !filterCategory ? 'var(--brand-primary)' : 'var(--card-subtle)',
                  color: !filterCategory ? '#000' : 'var(--text-color)',
                  borderColor: !filterCategory ? 'var(--brand-primary)' : 'var(--glass-border)',
                }}
              >
                All
              </button>
              {CATEGORIES.slice(0, 6).map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setFilterCategory(filterCategory === cat.name ? null : cat.name)}
                  className="shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border theme-transition"
                  style={{
                    backgroundColor: filterCategory === cat.name ? cat.color : 'var(--card-subtle)',
                    color: filterCategory === cat.name ? '#fff' : 'var(--text-color)',
                    borderColor: filterCategory === cat.name ? cat.color : 'var(--glass-border)',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const catInfo = CATEGORIES.find(c => c.name === expense.category);
                const Icon = catInfo?.icon || BarChart2;
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 glass rounded-[1.8rem] border theme-transition"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center" style={{ backgroundColor: `${catInfo?.color}15` }}>
                        <Icon className="w-5 h-5" style={{ color: catInfo?.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{expense.title}</p>
                          {expense.isRecurring && (
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase">
                              {expense.recurringTag}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{expense.date} • {expense.category}</p>
                      </div>
                    </div>
                    <p className="font-black text-sm" style={{ color: 'var(--text-color)' }}>-₹{expense.amount.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Right Column: Quick Add Expense (Visible on lg+) */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="glass rounded-[2.5rem] p-7 border theme-transition sticky top-24 space-y-6"
          style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Add Expense</h3>
          </div>

          <div className="space-y-4">
            <input
              placeholder="What did you spend on?"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                const suggested = suggestCategory(e.target.value);
                setNewCategory(suggested);
              }}
              className="w-full h-14 px-5 rounded-2xl text-xs font-bold focus:outline-none border-2 transition-all theme-transition"
              style={{
                backgroundColor: 'var(--card-subtle)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-color)',
              }}
            />
            {newTitle && (
              <div className="flex items-center gap-2 px-2">
                <Sparkles className="w-3 h-3 text-brand" />
                <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                  Auto-suggested: {newCategory}
                </span>
              </div>
            )}

            <input
              placeholder="Amount (₹)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
              type="tel"
              className="w-full h-14 px-5 rounded-2xl text-xs font-bold focus:outline-none border-2 transition-all theme-transition"
              style={{
                backgroundColor: 'var(--card-subtle)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-color)',
              }}
            />

            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setNewCategory(cat.name)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all border theme-transition"
                  style={{
                    backgroundColor: newCategory === cat.name ? `${cat.color}20` : 'var(--card-subtle)',
                    borderColor: newCategory === cat.name ? cat.color : 'var(--glass-border)',
                  }}
                >
                  <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                  <span className="text-[8px] font-black uppercase" style={{ color: newCategory === cat.name ? cat.color : '#9CA3AF' }}>{cat.name.substring(0, 5)}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddExpense}
            disabled={!newTitle || !newAmount}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${!newTitle || !newAmount ? 'opacity-30' : ''}`}
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: '#000',
              boxShadow: '0 10px 30px var(--brand-glow)',
            }}
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Add Expense Modal (for Mobile Viewports) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-t-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-8 duration-300 theme-transition"
            style={{ backgroundColor: 'var(--bg-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Add Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="What did you spend on?"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  const suggested = suggestCategory(e.target.value);
                  setNewCategory(suggested);
                }}
                className="w-full h-16 px-6 rounded-2xl text-sm font-bold focus:outline-none border-2 transition-all theme-transition"
                style={{
                  backgroundColor: 'var(--card-subtle)',
                  borderColor: 'var(--glass-border)',
                  color: 'var(--text-color)',
                }}
              />
              {newTitle && (
                <div className="flex items-center gap-2 px-2">
                  <Sparkles className="w-3 h-3 text-brand" />
                  <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                    Auto-suggested: {newCategory}
                  </span>
                </div>
              )}

              <input
                placeholder="Amount (₹)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
                type="tel"
                className="w-full h-16 px-6 rounded-2xl text-sm font-bold focus:outline-none border-2 transition-all theme-transition"
                style={{
                  backgroundColor: 'var(--card-subtle)',
                  borderColor: 'var(--glass-border)',
                  color: 'var(--text-color)',
                }}
              />

              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setNewCategory(cat.name)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all border theme-transition"
                    style={{
                      backgroundColor: newCategory === cat.name ? `${cat.color}20` : 'var(--card-subtle)',
                      borderColor: newCategory === cat.name ? cat.color : 'var(--glass-border)',
                    }}
                  >
                    <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                    <span className="text-[8px] font-black uppercase" style={{ color: newCategory === cat.name ? cat.color : '#9CA3AF' }}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              disabled={!newTitle || !newAmount}
              className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${!newTitle || !newAmount ? 'opacity-30' : ''}`}
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#000',
                boxShadow: '0 10px 30px var(--brand-glow)',
              }}
            >
              Add Expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTracker;
