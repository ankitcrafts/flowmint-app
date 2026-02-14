
import { useState, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, ResponsiveContainer, Cell, XAxis, Tooltip,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  ArrowDownLeft, Sparkles,
  Coffee, Zap, TrendingDown, Info,
  Eye, EyeOff, ArrowUpRight, Landmark, CreditCard,
  BarChart2, Activity, ShieldAlert, ChevronRight,
  Fingerprint, Heart, Target, AlertTriangle, Shield, Clock,
  Plus, Bell, Percent, TrendingUp, Calculator
} from 'lucide-react';
import { getSpendingInsights } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { Transaction } from '../types';
import SustainabilityCard from './SustainabilityCard';

const DAILY_STATS = [
  { name: 'Mon', value: 400 }, { name: 'Tue', value: 300 }, { name: 'Wed', value: 850 },
  { name: 'Thu', value: 200 }, { name: 'Fri', value: 1200 }, { name: 'Sat', value: 500 }, { name: 'Sun', value: 300 },
];

const TREND_STATS = [
  { name: 'W1', spent: 12000, limit: 15000 },
  { name: 'W2', spent: 18000, limit: 15000 },
  { name: 'W3', spent: 9000, limit: 15000 },
  { name: 'W4', spent: 14000, limit: 15000 },
];

const WEALTH_HISTORY = [
  { date: 'Nov 22', balance: 42000 }, { date: 'Nov 28', balance: 45000 },
  { date: 'Dec 05', balance: 68000 }, { date: 'Dec 12', balance: 62000 },
  { date: 'Dec 18', balance: 58000 }, { date: 'Dec 22', balance: 59820 },
];

interface DashboardProps {
  theme?: 'light' | 'dark';
  userProfile?: { name: string; email: string; avatar: string; verified?: boolean; } | null;
  onNavigate?: (tab: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-black" style={{ color: p.color || 'var(--text-color)' }}>
            ₹{p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: FC<DashboardProps> = ({ theme = 'dark', userProfile, onNavigate }) => {
  const [insight, setInsight] = useState("Analyzing your flow...");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [chartView, setChartView] = useState<'daily' | 'trend'>('daily');
  const [brandPrimary, setBrandPrimary] = useState('#00FFA3');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [txs] = await Promise.all([apiService.getTransactions()]);
      setTransactions(txs);
      const aiInsight = await getSpendingInsights(txs);
      setInsight(aiInsight);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
    if (color) setBrandPrimary(color);
  }, [theme]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-48 glass rounded-[2.5rem]" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
        <div className="h-20 glass rounded-3xl" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
        <div className="h-64 glass rounded-[2.5rem]" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
      </div>
    );
  }

  const containerReq = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemReq = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Simulated data for dashboard widgets
  const creditScore = 782;
  const emiToIncome = 36;
  const monthlyIncome = 50000;
  const totalEMI = 17999;
  const loanReadiness = 72;
  const upcomingBills = 3;
  const totalDue = 7599;

  return (
    <motion.div
      variants={containerReq}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-4"
    >
      {/* Verification Nudge Tile */}
      {!userProfile?.verified && (
        <motion.div variants={itemReq} className="glass rounded-[2rem] p-5 border-2 border-brand/20 bg-brand/5 flex items-center justify-between group cursor-pointer hover:bg-brand/10 transition-all shadow-[0_10px_30px_rgba(0,255,163,0.1)]"
          onClick={() => onNavigate?.('credit')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/20 rounded-2xl flex items-center justify-center text-brand shadow-[0_0_15px_var(--brand-glow)]">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-brand">Complete eKYC</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Unlock ₹50L Limit & Premium Perks</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ChevronRight className="w-5 h-5 text-brand" />
          </div>
        </motion.div>
      )}

      {/* Wealth Card */}
      <motion.section variants={itemReq} className="glass rounded-[2.5rem] border overflow-hidden theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="p-7 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center p-1.5 shadow-lg"><Landmark className="text-white w-full h-full" /></div>
             <div><h4 className="font-black text-sm uppercase tracking-tighter" style={{ color: 'var(--text-color)' }}>HDFC Bank</h4><p className="text-[10px] text-gray-500 font-bold">***3566</p></div>
          </div>
          <button className="p-2 glass rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}><CreditCard className="w-4 h-4 text-brand" /></button>
        </div>

        <div className="px-7 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-gray-500 hover:text-brand transition-colors">
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <h2 className={`text-4xl font-black mt-2 tracking-tighter transition-all ${showBalance ? '' : 'blur-lg opacity-30'}`} style={{ color: 'var(--text-color)' }}>₹59,823<span className="text-xl opacity-40">.59</span></h2>
        </div>

        <div className="h-28 w-full mt-4 -mb-1 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={WEALTH_HISTORY} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs><linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={brandPrimary} stopOpacity={0.3}/><stop offset="95%" stopColor={brandPrimary} stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="balance" stroke={brandPrimary} strokeWidth={3} fillOpacity={1} fill="url(#wealthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Quick Actions Row */}
      <motion.div variants={itemReq} className="grid grid-cols-4 gap-3">
        <QuickAction icon={<Plus className="w-5 h-5" />} label="Add Expense" onTap={() => onNavigate?.('expenses')} />
        <QuickAction icon={<Target className="w-5 h-5" />} label="Goals" onTap={() => onNavigate?.('wishes')} />
        <QuickAction icon={<Bell className="w-5 h-5" />} label="Bills" onTap={() => onNavigate?.('bills')} badge={upcomingBills} />
        <QuickAction icon={<Calculator className="w-5 h-5" />} label="Loans" onTap={() => onNavigate?.('loans')} />
      </motion.div>

      {/* Strategic Widget Row 1: Credit + EMI Stress */}
      <motion.div variants={itemReq} className="grid grid-cols-2 gap-4">
        {/* Credit Health Score Widget */}
        <div className="glass rounded-[2rem] p-5 border theme-transition cursor-pointer hover:border-brand/30 transition-all"
          style={{ borderColor: 'var(--glass-border)' }}
          onClick={() => onNavigate?.('credit')}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-brand" />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Credit Health</span>
          </div>
          <h3 className="text-3xl font-black tracking-tighter text-brand">{creditScore}</h3>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-brand" />
            <span className="text-[9px] font-black text-brand uppercase">+12 pts</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
            <div className="h-full bg-brand rounded-full" style={{ width: `${((creditScore - 300) / 600) * 100}%` }}></div>
          </div>
        </div>

        {/* EMI Stress Meter */}
        <div className="glass rounded-[2rem] p-5 border theme-transition cursor-pointer hover:border-brand/30 transition-all"
          style={{ borderColor: 'var(--glass-border)' }}
          onClick={() => onNavigate?.('bills')}>
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4" style={{ color: emiToIncome > 40 ? '#F59E0B' : 'var(--brand-primary)' }} />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">EMI Stress</span>
          </div>
          <h3 className="text-3xl font-black tracking-tighter" style={{ color: emiToIncome > 40 ? '#F59E0B' : 'var(--brand-primary)' }}>
            {emiToIncome}%
          </h3>
          <span className="text-[9px] font-black text-gray-500 uppercase">of income</span>
          <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${emiToIncome}%`,
              backgroundColor: emiToIncome > 50 ? '#EF4444' : emiToIncome > 35 ? '#F59E0B' : 'var(--brand-primary)'
            }}></div>
          </div>
        </div>
      </motion.div>

      {/* Loan Readiness Indicator */}
      <motion.div variants={itemReq}
        className="glass rounded-[2rem] p-5 border theme-transition cursor-pointer hover:border-brand/30 transition-all"
        style={{ borderColor: 'var(--glass-border)' }}
        onClick={() => onNavigate?.('loans')}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-brand" />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Loan Readiness</span>
            </div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--brand-primary)' }}>{loanReadiness}%</h3>
              <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${loanReadiness >= 80 ? 'bg-brand/10 text-brand' : loanReadiness >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                {loanReadiness >= 80 ? 'High' : loanReadiness >= 50 ? 'Moderate' : 'Basic'}
              </span>
            </div>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" stroke="var(--glass-border)" strokeWidth="4" fill="transparent" />
              <circle cx="28" cy="28" r="24" stroke="var(--brand-primary)" strokeWidth="4" fill="transparent"
                strokeDasharray={`${2 * Math.PI * 24 * loanReadiness / 100} ${2 * Math.PI * 24}`}
                strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Bill Reminder Summary */}
      <motion.div variants={itemReq}
        className="glass rounded-[2rem] p-5 border theme-transition cursor-pointer hover:border-brand/30 transition-all"
        style={{ borderColor: 'var(--glass-border)' }}
        onClick={() => onNavigate?.('bills')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500/10">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upcoming Bills</p>
              <p className="text-lg font-black mt-0.5" style={{ color: 'var(--text-color)' }}>
                {upcomingBills} bills totaling <span className="text-orange-400">₹{totalDue.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
      </motion.div>

      {/* AI Wish Tracker Highlights */}
      <motion.div variants={itemReq}
        className="glass rounded-[2rem] p-5 border bg-gradient-to-r from-brand/5 to-purple-500/5 theme-transition cursor-pointer hover:border-brand/30 transition-all"
        style={{ borderColor: 'var(--glass-border)' }}
        onClick={() => onNavigate?.('wishes')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-glow)' }}>
              <Heart className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">AI Wish Tracker</p>
              <p className="text-xs text-gray-400 mt-0.5 font-bold">iPhone 16 Pro in <span className="text-brand font-black">5 months</span> at current rate</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-brand" />
        </div>
      </motion.div>

      {/* AI Insight */}
      <motion.div variants={itemReq} className="glass rounded-3xl p-5 border flex gap-4 items-start theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-glow)' }}><Sparkles className="w-6 h-6 text-brand" /></div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-brand uppercase tracking-widest">Flow AI Personality</p>
          <p className="text-sm leading-relaxed font-medium italic" style={{ color: 'var(--text-color)' }}>"{insight}"</p>
        </div>
      </motion.div>

      {/* Sustainability Card */}
      <motion.div variants={itemReq}>
        <SustainabilityCard />
      </motion.div>

      {/* Unified Spending Flow & Cash Flow Section */}
      <motion.section variants={itemReq} className="glass rounded-[2.5rem] p-7 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Spending Flow</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Trend Intelligence</p>
          </div>
          <div className="flex p-1 rounded-xl gap-1" style={{ backgroundColor: 'var(--card-subtle)' }}>
            <button
              onClick={() => setChartView('daily')}
              className={`p-2 rounded-lg transition-all ${chartView === 'daily' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartView('trend')}
              className={`p-2 rounded-lg transition-all ${chartView === 'trend' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Charts View */}
        <div className="h-48 w-full -ml-4 mb-10">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'daily' ? (
              <BarChart data={DAILY_STATS}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#6B7280' }} dy={10} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={24}>
                  {DAILY_STATS.map((entry, index) => <Cell key={`c-${index}`} fill={entry.value > 800 ? brandPrimary : 'var(--glass-border)'} />)}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={TREND_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#6B7280' }} dy={10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="spent" stroke={brandPrimary} strokeWidth={3} fillOpacity={0.2} fill={brandPrimary} />
                <Area type="monotone" dataKey="limit" stroke="#EF4444" strokeWidth={1} strokeDasharray="5 5" fill="transparent" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Summary Numbers */}
        <div className="pt-8 border-t space-y-6" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-3">
             <TrendingDown className="w-5 h-5 text-brand" />
             <h3 className="font-black text-lg tracking-tight" style={{ color: 'var(--text-color)' }}>Cash Flow</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Spent</p>
                <p className="text-xl font-black mt-1" style={{ color: 'var(--text-color)' }}>₹24,500</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Budget Left</p>
                <p className="text-xl font-black mt-1 text-brand">₹15,500</p>
              </div>
            </div>

            <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-subtle)' }}>
              <div className="h-full bg-brand w-[62%] shadow-[0_0_10px_var(--brand-glow)]"></div>
            </div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">62% of monthly budget consumed</p>
          </div>
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section variants={itemReq} className="space-y-4">
        <h3 className="font-black text-lg px-2" style={{ color: 'var(--text-color)' }}>Recent Swipes</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 glass rounded-[1.8rem] border theme-transition"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
                  {tx.category === 'Food' ? <Coffee className="w-5 h-5 text-orange-400" /> : <Zap className="w-5 h-5 text-brand" />}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{tx.title}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{tx.date} • {tx.category}</p>
                </div>
              </div>
              <p className={`font-black text-sm ${tx.type === 'expense' ? '' : 'text-brand'}`} style={{ color: tx.type === 'expense' ? 'var(--text-color)' : undefined }}>
                {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

const QuickAction: FC<{ icon: React.ReactNode; label: string; onTap?: () => void; badge?: number }> = ({ icon, label, onTap, badge }) => (
  <button
    onClick={onTap}
    className="flex flex-col items-center gap-2 p-4 glass rounded-2xl border theme-transition hover:border-brand/30 transition-all relative"
    style={{ borderColor: 'var(--glass-border)' }}
  >
    {badge && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[8px] font-black text-white flex items-center justify-center">
        {badge}
      </span>
    )}
    <div className="text-brand">{icon}</div>
    <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider">{label}</span>
  </button>
);

export default Dashboard;
