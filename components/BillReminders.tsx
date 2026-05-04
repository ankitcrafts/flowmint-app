
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Calendar, Clock, AlertTriangle, CheckCircle2, Plus, X,
  Zap, Smartphone, Home, Wifi, Droplets, CreditCard, Flame,
  ChevronRight, Shield, TrendingUp, ShieldCheck, Lock
} from 'lucide-react';

interface Bill {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
  isPaid: boolean;
  isOverdue: boolean;
  icon: string;
  lateFee?: number;
}

const MOCK_BILLS: Bill[] = [
  { id: '1', title: 'Electricity Bill', category: 'Utility', amount: 2100, dueDate: 'Feb 18', daysLeft: 4, isPaid: false, isOverdue: false, icon: 'zap' },
  { id: '2', title: 'House Rent', category: 'Rent', amount: 15000, dueDate: 'Feb 1', daysLeft: -13, isPaid: false, isOverdue: true, icon: 'home', lateFee: 500 },
  { id: '3', title: 'iPhone 15 EMI', category: 'EMI', amount: 5499, dueDate: 'Feb 16', daysLeft: 2, isPaid: false, isOverdue: false, icon: 'phone' },
  { id: '4', title: 'Broadband', category: 'Utility', amount: 899, dueDate: 'Feb 20', daysLeft: 6, isPaid: false, isOverdue: false, icon: 'wifi' },
  { id: '5', title: 'SIP - Axis Bluechip', category: 'Investment', amount: 5000, dueDate: 'Feb 10', daysLeft: 0, isPaid: true, isOverdue: false, icon: 'trending' },
  { id: '6', title: 'Car Loan EMI', category: 'EMI', amount: 12500, dueDate: 'Feb 5', daysLeft: 0, isPaid: true, isOverdue: false, icon: 'card' },
  { id: '7', title: 'Gas Cylinder', category: 'Utility', amount: 903, dueDate: 'Feb 25', daysLeft: 11, isPaid: false, isOverdue: false, icon: 'flame' },
  { id: '8', title: 'Water Bill', category: 'Utility', amount: 450, dueDate: 'Feb 28', daysLeft: 14, isPaid: false, isOverdue: false, icon: 'water' },
];

const getIcon = (icon: string) => {
  const map: Record<string, React.ReactNode> = {
    zap: <Zap className="w-5 h-5 text-yellow-400" />,
    home: <Home className="w-5 h-5 text-red-400" />,
    phone: <Smartphone className="w-5 h-5 text-brand" />,
    wifi: <Wifi className="w-5 h-5 text-cyan-400" />,
    trending: <TrendingUp className="w-5 h-5 text-brand" />,
    card: <CreditCard className="w-5 h-5 text-amber-500" />,
    flame: <Flame className="w-5 h-5 text-orange-400" />,
    water: <Droplets className="w-5 h-5 text-brand" />,
  };
  return map[icon] || <Bell className="w-5 h-5 text-gray-400" />;
};

const BillReminders: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'paid'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const filteredBills = useMemo(() => {
    switch (filter) {
      case 'upcoming': return bills.filter(b => !b.isPaid && !b.isOverdue);
      case 'overdue': return bills.filter(b => b.isOverdue);
      case 'paid': return bills.filter(b => b.isPaid);
      default: return bills;
    }
  }, [bills, filter]);

  const totalDue = useMemo(() => bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
  const overdueCount = useMemo(() => bills.filter(b => b.isOverdue).length, [bills]);
  const totalLateFees = useMemo(() => bills.filter(b => b.isOverdue && b.lateFee).reduce((s, b) => s + (b.lateFee || 0), 0), [bills]);

  const markPaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: true, isOverdue: false } : b));
  };

  const totalEMI = useMemo(() => bills.filter(b => b.category === 'EMI').reduce((s, b) => s + b.amount, 0), [bills]);
  const monthlyIncome = 50000; // Simulated
  const emiToIncome = Math.round((totalEMI / monthlyIncome) * 100);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Bills & EMIs</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Never miss a payment</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 bg-brand rounded-2xl text-black flex items-center justify-center shadow-lg"
          style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="glass rounded-2xl p-5 border border-red-500/30 bg-red-500/5 flex items-start gap-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">
              {overdueCount} Overdue Bill{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Late fee risk: ₹{totalLateFees.toLocaleString()}. Pay now to avoid penalties.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-[2rem] p-5 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Due</p>
          <h3 className="text-2xl font-black mt-2 tracking-tighter" style={{ color: 'var(--text-color)' }}>
            ₹{totalDue.toLocaleString()}
          </h3>
          <p className="text-[9px] font-black text-orange-400 mt-1 uppercase">This month</p>
        </div>
        <div className="glass rounded-[2rem] p-5 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">EMI Stress</p>
          <h3 className="text-2xl font-black mt-2 tracking-tighter" style={{ color: emiToIncome > 50 ? '#EF4444' : emiToIncome > 35 ? '#F59E0B' : 'var(--brand-primary)' }}>
            {emiToIncome}%
          </h3>
          <p className="text-[9px] font-black text-gray-500 mt-1 uppercase">of income</p>
        </div>
      </div>

      {/* EMI Stress Meter Visual */}
      <div className="glass rounded-[2rem] p-6 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">EMI-to-Income Ratio</p>
          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${emiToIncome > 50 ? 'bg-red-500/10 text-red-400' : emiToIncome > 35 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-brand/10 text-brand'}`}>
            {emiToIncome > 50 ? 'High Risk' : emiToIncome > 35 ? 'Moderate' : 'Healthy'}
          </span>
        </div>
        <div className="h-3 w-full rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--glass-border)' }}>
          <div className="h-full bg-brand transition-all duration-700 rounded-full"
            style={{ width: `${Math.min(100, emiToIncome)}%`, backgroundColor: emiToIncome > 50 ? '#EF4444' : emiToIncome > 35 ? '#F59E0B' : 'var(--brand-primary)' }}>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[8px] font-black text-gray-500 uppercase">
          <span>0%</span>
          <span className="text-brand">35% Safe</span>
          <span className="text-yellow-400">50%</span>
          <span className="text-red-400">100%</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 rounded-2xl gap-1 theme-transition" style={{ backgroundColor: 'var(--card-subtle)' }}>
        {(['all', 'upcoming', 'overdue', 'paid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bill List */}
      <div className="space-y-3">
        {filteredBills.map(bill => (
          <div
            key={bill.id}
            className={`flex items-center justify-between p-5 glass rounded-[1.8rem] border theme-transition ${bill.isPaid ? 'opacity-50' : ''} ${bill.isOverdue ? 'border-red-500/30' : ''}`}
            style={{ borderColor: bill.isOverdue ? undefined : 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
                {getIcon(bill.icon)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{bill.title}</p>
                  {bill.isOverdue && (
                    <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 uppercase animate-pulse">
                      Overdue
                    </span>
                  )}
                  {bill.isPaid && (
                    <CheckCircle2 className="w-4 h-4 text-brand" />
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">
                  {bill.isPaid ? 'Paid' : bill.isOverdue ? `Due ${bill.dueDate} • Late fee ₹${bill.lateFee}` : `Due ${bill.dueDate} • ${bill.daysLeft}d left`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-sm" style={{ color: 'var(--text-color)' }}>₹{bill.amount.toLocaleString()}</p>
              {!bill.isPaid && (
                <button
                  onClick={() => markPaid(bill.id)}
                  className="text-[10px] text-brand font-black uppercase tracking-widest mt-1 hover:underline"
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Late Fee Alert */}
      {overdueCount > 0 && (
        <div className="glass rounded-[2rem] p-6 border bg-gradient-to-br from-red-500/5 to-transparent theme-transition"
          style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-brand" />
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">AI Advisory</span>
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-color)' }}>
            "You have {overdueCount} overdue bill{overdueCount > 1 ? 's' : ''} totaling ₹{totalLateFees.toLocaleString()} in late fees.
            Paying within the next 48 hours prevents further penalties and protects your credit score."
          </p>
        </div>
      )}
      {/* ─── Vivid Simulated Mode Indicator ─── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="mt-8 relative group pb-10"
      >
        <div className="absolute inset-0 bg-brand/5 blur-xl rounded-[2rem] group-hover:bg-brand/10 transition-all duration-500" />
        <div className="relative glass rounded-3xl p-6 border border-brand/10 flex flex-col items-center gap-3 text-center theme-transition">
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <ShieldCheck className="w-5 h-5 text-brand" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Vivid Simulation Engine</span>
          </div>
          
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-[260px]">
            Payment reminders and bill parsing are <span className="text-brand">simulated for this experience</span>. BBPS & utility integrations are currently in sandbox.
          </p>

          <div className="flex items-center gap-6 pt-2 border-t border-brand/5 w-full justify-center">
             <div className="flex items-center gap-1 text-[9px] font-black text-brand">
                <Lock className="w-2.5 h-2.5" /> SECURE LINK
             </div>
             <div className="w-px h-3 bg-brand/10" />
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Live Sandbox</span>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BillReminders;
