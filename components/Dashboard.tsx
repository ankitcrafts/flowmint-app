
import { useState, useEffect, useRef, type FC } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  BarChart, Bar, ResponsiveContainer, Cell, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  ArrowDownLeft, Sparkles, Download,
  Coffee, Zap, TrendingDown, Info,
  Eye, EyeOff, ArrowUpRight, Landmark, CreditCard,
  BarChart2, Activity, ShieldAlert, ChevronRight,
  Fingerprint, Heart, Target, AlertTriangle, Shield, Clock,
  Plus, Bell, Percent, TrendingUp, Calculator, ShieldCheck, Lock,
  Car, Banknote, Play, ShoppingBag, Wifi, Fuel, UtensilsCrossed,
  Gamepad2, Music, Plane, Home, BookOpen, Dumbbell, Pill
} from 'lucide-react';
import { llmService } from '../services/llmService';
import { apiService, dashboardService, transactionService, DashboardData } from '../services/apiService';
import { Transaction } from '../types';


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

const PERFORMANCE_DATA = [
  { month: 'Jan', usdc: 2100000, token: 2300000 },
  { month: 'Feb', usdc: 1400000, token: 2000000 },
  { month: 'Mar', usdc: 1600000, token: 2050000 },
  { month: 'Apr', usdc: 1450000, token: 1750000 },
  { month: 'May', usdc: 1550000, token: 1850000 },
  { month: 'Jun', usdc: 1850000, token: 2000000 },
  { month: 'Jul', usdc: 2000000, token: 1700000 },
  { month: 'Aug', usdc: 2450000, token: 2000000 },
  { month: 'Sep', usdc: 2700000, token: 1850000 },
  { month: 'Oct', usdc: 2200000, token: 1350000 },
  { month: 'Nov', usdc: 2550000, token: 1550000 },
  { month: 'Dec', usdc: 3050000, token: 1820000 },
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

// ─── Animated Counter Component ────────────────────────────
const AnimatedCounter: FC<{ value: number; duration?: number; prefix?: string; suffix?: string; className?: string; style?: React.CSSProperties }> = 
  ({ value, duration = 1.5, prefix = '', suffix = '', className = '', style }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: '-50px' });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate: (v) => setDisplayed(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value, duration]);

  return <span ref={nodeRef} className={className} style={style}>{prefix}{displayed.toLocaleString()}{suffix}</span>;
};

// ─── Animated Progress Bar ─────────────────────────────────
const AnimatedProgressBar: FC<{ progress: number; color?: string; delay?: number; height?: string }> = 
  ({ progress, color = 'var(--brand-primary)', delay = 0.3, height = 'h-2' }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(barRef, { once: true, margin: '-30px' });
  
  return (
    <div ref={barRef} className={`${height} w-full rounded-full overflow-hidden`} style={{ backgroundColor: 'var(--glass-border)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0, opacity: 0 }}
        animate={isInView ? { width: `${progress}%`, opacity: 1 } : { width: 0, opacity: 0 }}
        transition={{ duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
      />
    </div>
  );
};

// ─── Animated Circular Progress (SVG) — Enhanced ───────────
const AnimatedCircularProgress: FC<{ progress: number; size?: number; strokeWidth?: number; delay?: number; color?: string; glowColor?: string }> = 
  ({ progress, size = 80, strokeWidth = 6, delay = 0.6, color, glowColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const circleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(circleRef, { once: true, margin: '-30px' });

  const gradientId = `circGrad-${Math.random().toString(36).slice(2, 8)}`;
  const strokeColor = color || 'var(--brand-primary)';
  const glow = glowColor || 'var(--brand-glow)';
  
  return (
    <div ref={circleRef} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--glass-border)" strokeWidth={strokeWidth} fill="transparent"
          opacity={0.5}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} fill="transparent"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={isInView ? { strokeDasharray: `${circumference * progress / 100} ${circumference}` } : {}}
          transition={{ duration: 1.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      {/* Percentage inside */}
      <motion.span
        className="absolute font-black text-sm"
        style={{ color: strokeColor }}
        initial={{ opacity: 0, scale: 0 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: delay + 0.8, type: 'spring' as const, stiffness: 300 }}
      >
        {progress}%
      </motion.span>
      {/* Breathing glow */}
      <motion.div
        className="absolute inset-[-4px] rounded-full pointer-events-none"
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{ boxShadow: `0 0 25px ${glow}` }}
      />
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Ensure Token Price (Green) appears above USDC (Gold)
    const sortedPayload = [...payload].sort((a, b) => a.dataKey === 'token' ? -1 : 1);
    return (
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-white/5">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#C9A227] mb-2">{label}</p>
        <div className="space-y-1">
          {sortedPayload.map((p: any, i: number) => {
            const color = p.dataKey === 'token' ? '#22C55E' : '#C9A227';
            return (
              <p key={i} className="text-[17px] font-black leading-tight" style={{ color }}>
                ₹{p.value.toLocaleString()}
              </p>
            );
          })}
        </div>
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
  const [creditScore, setCreditScore] = useState<number | null>(null); // default mock/cache

  // Real data state
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [dailyStats, setDailyStats] = useState<{name: string, value: number}[]>(DAILY_STATS);
  const [wealthHistory, setWealthHistory] = useState<{date: string, balance: number}[]>(WEALTH_HISTORY);

  // ─── Theme-Aware Brand Colors (Matches index.css) ──────────
  const brandPrimary = theme === 'light' ? '#C9A227' : '#22C55E';
  const brandGlow = theme === 'light' ? 'rgba(201, 162, 39, 0.1)' : 'rgba(34, 197, 94, 0.15)';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [txs, summaryData, dailyData] = await Promise.all([
        apiService.getTransactions(),
        dashboardService.getSummary().catch(() => null),
        transactionService.getDailySpending(7).catch(() => []),
      ]);
      setTransactions(txs);
      
      if (summaryData) {
        setSummary(summaryData);
        if (summaryData.creditScore) {
          setCreditScore(summaryData.creditScore);
        }
        setWealthHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { date: 'Today', balance: summaryData.balance };
          return newHistory;
        });
      }
      if (dailyData?.length > 0) {
        setDailyStats(dailyData.map(d => ({ name: d.day, value: d.amount })));
      }
      try {
        const insightData = await llmService.getSpendingInsight({
          transactions: txs.slice(0, 15).map(t => ({
            title: t.title,
            amount: t.amount,
            category: t.category || 'uncategorized',
            type: t.type,
          })),
        });
        setInsight(`${insightData.personality}: ${insightData.tip}`);
      } catch {
        setInsight('Keep tracking your spending — your financial awareness is already a superpower!');
      }
      setLoading(false);
    };
    fetchData();
  }, []);



  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-48 glass rounded-[2.5rem]" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
        <div className="h-20 glass rounded-3xl" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
        <div className="h-64 glass rounded-[2.5rem]" style={{ backgroundColor: 'var(--card-subtle)' }}></div>
      </div>
    );
  }

  // ─── Animation Variants ──────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const cardSlideUp = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: { 
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
    }
  };

  const cardSlideRight = {
    hidden: { opacity: 0, x: -30 },
    show: { 
      opacity: 1, x: 0,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
    }
  };

  // Real Computed Data
  const monthlyIncome = summary?.income || 0;
  const upcomingBills = summary?.billsSummary?.unpaid || 0;
  const totalDue = summary?.billsSummary?.total || 0;
  
  // Estimate EMI Stress (total bills vs monthly income)
  const emiToIncome = monthlyIncome > 0 ? Math.min(100, Math.round((totalDue / monthlyIncome) * 100)) : 0;
  
  // Estimate Loan Readiness based on credit score (300-900 scale)
  const loanReadiness = creditScore ? Math.max(0, Math.min(100, Math.round(((creditScore - 300) / 600) * 100))) : 0;
  const currentBalance = summary?.balance || 0;

  // ─── Category Configuration for Transaction Icons ────────────
  const getCategoryConfig = (category: string, type: string) => {
    const cat = category?.toLowerCase() || '';
    if (type === 'income') return { icon: <Banknote className="w-5 h-5" style={{ color: '#10B981' }} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('dining')) return { icon: <UtensilsCrossed className="w-5 h-5" style={{ color: '#F97316' }} />, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' };
    if (cat.includes('travel') || cat.includes('transport') || cat.includes('uber') || cat.includes('cab')) return { icon: <Car className="w-5 h-5" style={{ color: '#3B82F6' }} />, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    if (cat.includes('subscription') || cat.includes('streaming') || cat.includes('netflix')) return { icon: <Play className="w-5 h-5" style={{ color: '#8B5CF6' }} />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
    if (cat.includes('shopping') || cat.includes('amazon') || cat.includes('retail')) return { icon: <ShoppingBag className="w-5 h-5" style={{ color: '#EC4899' }} />, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
    if (cat.includes('fuel') || cat.includes('gas') || cat.includes('petrol')) return { icon: <Fuel className="w-5 h-5" style={{ color: '#EF4444' }} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    if (cat.includes('utility') || cat.includes('electric') || cat.includes('wifi') || cat.includes('internet')) return { icon: <Wifi className="w-5 h-5" style={{ color: '#06B6D4' }} />, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
    if (cat.includes('entertainment') || cat.includes('gaming') || cat.includes('game')) return { icon: <Gamepad2 className="w-5 h-5" style={{ color: '#A855F7' }} />, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' };
    if (cat.includes('music') || cat.includes('spotify')) return { icon: <Music className="w-5 h-5" style={{ color: '#22C55E' }} />, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' };
    if (cat.includes('education') || cat.includes('book') || cat.includes('course')) return { icon: <BookOpen className="w-5 h-5" style={{ color: '#0EA5E9' }} />, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' };
    if (cat.includes('health') || cat.includes('medical') || cat.includes('pharma')) return { icon: <Pill className="w-5 h-5" style={{ color: '#14B8A6' }} />, color: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)' };
    if (cat.includes('fitness') || cat.includes('gym')) return { icon: <Dumbbell className="w-5 h-5" style={{ color: '#F59E0B' }} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    if (cat.includes('rent') || cat.includes('home') || cat.includes('housing')) return { icon: <Home className="w-5 h-5" style={{ color: '#6366F1' }} />, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' };
    if (cat.includes('flight') || cat.includes('airline') || cat.includes('trip')) return { icon: <Plane className="w-5 h-5" style={{ color: '#0284C7' }} />, color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' };
    // Default
    return { icon: <Zap className="w-5 h-5" style={{ color: '#D4A017' }} />, color: '#D4A017', bg: 'rgba(212, 160, 23, 0.12)' };
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--section-gap)] pb-24 md:pb-6"
    >
      {/* ═══ Verification Nudge ═══════════════════════════════ */}
      {!userProfile?.verified && (
        <motion.div 
          variants={cardSlideUp}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="col-span-1 lg:col-span-3 glass rounded-[2.2rem] p-[var(--card-padding)] border-2 border-brand/20 bg-brand/5 flex items-center justify-between group cursor-pointer hover:bg-brand/10 transition-all shadow-[0_10px_30px_rgba(0,255,163,0.1)]"
          onClick={() => onNavigate?.('credit')}>
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 bg-brand/20 rounded-2xl flex items-center justify-center text-brand shadow-[0_0_15px_var(--brand-glow)]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Fingerprint className="w-7 h-7" />
            </motion.div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-brand">Complete eKYC</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Unlock ₹50L Limit & Premium Perks</p>
            </div>
          </div>
          <motion.div 
            className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center"
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <ChevronRight className="w-5 h-5 text-brand" />
          </motion.div>
        </motion.div>
      )}

      {/* Left Column (2/3 width on Desktop) */}
      <div className="col-span-1 lg:col-span-2 space-y-[var(--section-gap)]">
        {/* ═══ Wealth Card ═══════════════════════════════════════ */}
        <motion.section 
          whileHover={{ y: -3 }}
          className="glass rounded-[2.5rem] border overflow-hidden theme-transition" 
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <div className="p-[var(--card-padding)] pb-2 flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
               <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center p-1.5 shadow-lg"><Landmark className="text-white w-full h-full" /></div>
               <div><h4 className="font-black text-sm uppercase tracking-tighter" style={{ color: 'var(--text-color)' }}>HDFC Bank</h4><p className="text-[10px] text-gray-500 font-bold">***3566</p></div>
            </motion.div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 glass rounded-xl" 
              style={{ backgroundColor: 'var(--card-subtle)' }}
            >
              <CreditCard className="w-4 h-4 text-brand" />
            </motion.button>
          </div>

          <div className="px-[var(--card-padding)] pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Balance</p>
              <motion.button 
                onClick={() => setShowBalance(!showBalance)} 
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                className="text-gray-500 hover:text-brand transition-colors"
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.h2 
                key={showBalance ? 'visible' : 'hidden'}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: showBalance ? 'blur(0px)' : 'blur(10px)' }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-4xl font-black mt-2 tracking-tighter"
                style={{ color: 'var(--text-color)' }}
              >
                ₹<AnimatedCounter value={currentBalance} /><span className="text-xl opacity-40">.00</span>
              </motion.h2>
            </AnimatePresence>
          </div>

          <motion.div 
            className="h-28 w-full mt-4 -mb-1 opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wealthHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={brandPrimary} stopOpacity={0.3}/><stop offset="95%" stopColor={brandPrimary} stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="balance" stroke={brandPrimary} strokeWidth={3} fillOpacity={1} fill="url(#wealthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.section>

        {/* ═══ Recent Performance Chart ═══════════════════════════════ */}
        <motion.section 
          variants={cardSlideUp} 
          className="glass rounded-[2.5rem] p-[var(--card-padding)] border theme-transition relative overflow-hidden group shadow-2xl" 
          style={{ 
            borderColor: 'var(--glass-border)',
            background: theme === 'light' ? 'var(--bg-color)' : 'rgba(255,255,255,0.02)'
          }}
        >
          {/* Subtle Background Mesh */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(var(--brand-primary) 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />

          <div className="flex flex-col mb-8 relative z-10">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>Recent performance</h3>
              
              {/* Controls */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex p-1 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                  {['1D', '5D', '1M', '6M', '1Y'].map((t) => (
                    <button key={t} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t === '1M' ? 'text-brand shadow-sm' : 'text-gray-500'}`} style={t === '1M' ? { backgroundColor: 'var(--brand-glow)' } : {}}>
                      {t}
                    </button>
                  ))}
                </div>
                <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ backgroundColor: 'var(--card-subtle)' }}>
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 mt-6">
              <div className="flex flex-col">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C9A227' }} />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">USDC</span>
                 </div>
                 <div className="flex items-baseline">
                    <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>32.658</span>
                    <span className="text-xl font-black text-gray-500">,45</span>
                 </div>
              </div>
              <div className="flex flex-col">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" style={{ backgroundColor: '#22C55E' }} />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Token price</span>
                 </div>
                 <div className="flex items-baseline">
                    <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>1.028</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative z-10 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 15, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="fadeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A227" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                  </linearGradient>
                  <pattern id="verticalStripes" width="6" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
                    <line x1="0" y1="0" x2="0" y2="20" stroke="#C9A227" strokeWidth="1" />
                  </pattern>
                  <mask id="stripeMask">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#verticalStripes)" />
                  </mask>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="transparent" />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} 
                  tickFormatter={(val) => val === 0 ? '0M' : `${val / 1000000}M`}
                  width={45}
                  domain={[0, 3000000]}
                  ticks={[0, 1000000, 1500000, 2000000, 2500000, 3000000]}
                />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} 
                  dy={10} 
                  interval={0}
                />
                <Tooltip 
                  cursor={{ stroke: '#C9A227', strokeWidth: 1, opacity: 0.5 }} 
                  content={<CustomTooltip />} 
                />
                {/* Secondary Series: Token Price */}
                <Area 
                  type="monotone" 
                  dataKey="token" 
                  stroke="#22C55E" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  fill="transparent" 
                  dot={false}
                  activeDot={false}
                />
                {/* Primary Series: USDC */}
                <Area 
                  type="monotone" 
                  dataKey="usdc" 
                  stroke="#C9A227" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#fadeGradient)" 
                  mask="url(#stripeMask)"
                  dot={false}
                  activeDot={{ r: 5, stroke: '#C9A227', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Summary Summary */}
          <div className="pt-8 border-t space-y-6 relative z-10" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
                   <TrendingDown className="w-5 h-5 text-brand" />
                 </div>
                 <div>
                    <h3 className="font-black text-lg tracking-tight" style={{ color: 'var(--text-color)' }}>Cash Flow</h3>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Balanced Status</p>
                 </div>
              </div>
              {/* Lively Status Badge */}
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-500/20"
              >
                STABLE
              </motion.div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Spent</p>
                  <p className="text-2xl font-black mt-1" style={{ color: 'var(--text-color)' }}>
                    <span className="text-sm opacity-40 mr-1">₹</span>
                    <AnimatedCounter value={24500} duration={1.8} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Budget Left</p>
                  <p className="text-2xl font-black mt-1 text-brand">
                    <span className="text-sm opacity-40 mr-1">₹</span>
                    <AnimatedCounter value={15500} duration={2} />
                  </p>
                </div>
              </div>

              <div className="relative pt-2">
                 <AnimatedProgressBar progress={62} color={brandPrimary} delay={1.2} />
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '62%' }}
                   transition={{ duration: 1.5, delay: 1.2 }}
                   className="absolute top-2 right-0 flex justify-end"
                 >
                   <div className="w-1 h-3 bg-brand/30 blur-[2px] rounded-full" />
                 </motion.div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Budget Control: <span className="text-brand">62%</span></p>
                 <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`w-1 h-1 rounded-full ${i <= 3 ? 'bg-brand' : 'bg-gray-700'}`} />
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ═══ Recent Activity ═══════════════════════════════════ */}
        <motion.section variants={cardSlideUp} className="space-y-[calc(var(--section-gap)*0.75)] pb-10">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <Activity className="w-5 h-5 text-brand" />
              </motion.div>
              <h3 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>Recent Swipes</h3>
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{transactions.length} transactions</span>
          </div>
          <div className="space-y-3">
            {transactions.map((tx, i) => {
              const catConfig = getCategoryConfig(tx.category, tx.type);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.08 * i, type: 'spring', stiffness: 180, damping: 18 }}
                  whileHover={{ scale: 1.03, x: 10 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center justify-between p-[var(--card-padding)] glass rounded-[1.8rem] border theme-transition cursor-pointer"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: catConfig.bg }}
                    >
                      {/* Subtle shimmer on icon container */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                        style={{ background: `linear-gradient(135deg, transparent 40%, ${catConfig.color}30 50%, transparent 60%)` }}
                      />
                      {catConfig.icon}
                    </motion.div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{tx.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{tx.date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: catConfig.color }}>{tx.category}</span>
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + 0.08 * i, type: 'spring', stiffness: 300 }}
                    className="text-right"
                  >
                    <p className="font-black text-sm" style={{ color: tx.type === 'income' ? '#10B981' : 'var(--text-color)' }}>
                      {tx.type === 'expense' ? '-' : '+'}<span className="text-[10px]">₹</span>{tx.amount.toLocaleString()}
                    </p>
                    {tx.type === 'income' && (
                      <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + 0.08 * i }}
                        className="text-[8px] font-black text-emerald-500 uppercase tracking-widest"
                      >
                        credited
                      </motion.span>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* Right Column (1/3 width on Desktop) */}
      <div className="col-span-1 space-y-[var(--section-gap)]">
        {/* ═══ Quick Actions ═════════════════════════════════════ */}
        <motion.div variants={cardSlideUp} className="grid grid-cols-4 gap-[calc(var(--section-gap)*0.6)]">
          {[
            { icon: <Plus className="w-5 h-5" />, label: 'Add Expense', tab: 'expenses' },
            { icon: <Target className="w-5 h-5" />, label: 'Goals', tab: 'wishes' },
            { icon: <Bell className="w-5 h-5" />, label: 'Bills', tab: 'bills', badge: upcomingBills },
            { icon: <Calculator className="w-5 h-5" />, label: 'Loans', tab: 'loans' },
          ].map((action, i) => (
            <motion.button
              key={action.tab}
              onClick={() => onNavigate?.(action.tab)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="group flex flex-col items-center justify-center p-2 min-h-[90px] w-full glass rounded-[1.2rem] border theme-transition hover:border-brand/40 hover:shadow-[0_4px_20px_var(--brand-glow)] transition-all relative z-10 cursor-pointer"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {typeof action.badge === 'number' && action.badge > 0 && (
                <motion.span 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-red-500/90 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-red-500/40 z-20"
                >
                  {action.badge}
                </motion.span>
              )}
              <motion.div 
                 className="text-brand mb-1.5"
                 whileHover={{ rotate: [0, -15, 15, -10, 10, 0], scale: 1.15 }}
                 transition={{ duration: 0.5 }}
              >
                {action.icon}
              </motion.div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest text-center leading-[1.2] group-hover:text-gray-300 transition-colors">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* ═══ Credit + EMI Stress Row ═══════════════════════════ */}
        <motion.div variants={cardSlideUp} className="grid grid-cols-2 gap-[var(--section-gap)]">
          {/* Credit Health */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="glass rounded-[2rem] p-[var(--card-padding)] border theme-transition cursor-pointer transition-all"
            style={{ borderColor: 'var(--glass-border)' }}
            onClick={() => onNavigate?.('credit')}
          >
            <motion.div 
              className="flex items-center gap-2 mb-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
                <Shield className="w-4 h-4 text-brand" />
              </motion.div>
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Credit Health</span>
            </motion.div>
            {creditScore === null ? (
              <>
                <h3 className="text-lg font-black tracking-tighter text-gray-500 mt-2 mb-2 leading-tight">
                  Unlock your<br/>CIBIL Score
                </h3>
                <div className="mt-4">
                  <AnimatedProgressBar progress={0} delay={0.8} height="h-1.5" />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-3xl font-black tracking-tighter text-brand">
                  <AnimatedCounter value={creditScore} duration={2} />
                </h3>
                <motion.div 
                  className="flex items-center gap-1 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <TrendingUp className="w-3 h-3 text-brand" />
                  </motion.div>
                  <span className="text-[9px] font-black text-brand uppercase">+12 pts</span>
                </motion.div>
                <div className="mt-3">
                  <AnimatedProgressBar progress={((creditScore - 300) / 600) * 100} color="var(--color-success)" delay={0.8} height="h-1.5" />
                </div>
              </>
            )}
          </motion.div>

          {/* EMI Stress */}
          <motion.div 
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="glass rounded-[2rem] p-[var(--card-padding)] border theme-transition cursor-pointer transition-all"
            style={{ borderColor: 'var(--glass-border)' }}
            onClick={() => onNavigate?.('bills')}
          >
            <motion.div 
              className="flex items-center gap-2 mb-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Percent className="w-4 h-4" style={{ color: emiToIncome > 40 ? '#F59E0B' : 'var(--brand-primary)' }} />
              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">EMI Stress</span>
            </motion.div>
            <h3 className="text-3xl font-black tracking-tighter" style={{ color: emiToIncome > 40 ? '#F59E0B' : 'var(--brand-primary)' }}>
              <AnimatedCounter value={emiToIncome} duration={1.8} suffix="%" />
            </h3>
            <span className="text-[9px] font-black text-gray-500 uppercase">of income</span>
            <div className="mt-3">
              <AnimatedProgressBar 
                progress={emiToIncome} 
                color={emiToIncome > 50 ? '#EF4444' : emiToIncome > 35 ? '#F59E0B' : 'var(--brand-primary)'} 
                delay={0.9}
                height="h-1.5"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ═══ Loan Readiness — Enhanced ═════════════════════════ */}
        {(() => {
          const statusConfig = loanReadiness >= 80 
            ? { label: 'HIGH', color: '#10B981', bg: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.4)', gradient: 'linear-gradient(135deg, #10B981, #059669)', desc: 'Excellent! You qualify for top-tier rates.' }
            : loanReadiness >= 50
              ? { label: 'MODERATE', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.4)', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', desc: 'Good standing. Improve to unlock better rates.' }
              : { label: 'BASIC', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', glow: 'rgba(239,68,68,0.4)', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', desc: 'Needs work. Build credit to improve eligibility.' };

          return (
            <motion.div 
              variants={cardSlideUp}
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="glass rounded-[2.2rem] p-[var(--card-padding)] border-2 theme-transition cursor-pointer transition-all relative overflow-hidden"
              style={{ borderColor: statusConfig.color + '30' }}
              onClick={() => onNavigate?.('loans')}
            >
              {/* Background status glow */}
              <motion.div 
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                animate={{ opacity: [0.08, 0.15, 0.08], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ backgroundColor: statusConfig.color }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  {/* Header */}
                  <motion.div 
                    className="flex items-center gap-2 mb-3"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusConfig.bg }}>
                      <Calculator className="w-4 h-4" style={{ color: statusConfig.color }} />
                    </div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Loan Readiness</span>
                  </motion.div>

                  {/* Score + Badge Row */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-black tracking-tighter" style={{ color: statusConfig.color }}>
                      <AnimatedCounter value={loanReadiness} duration={2} suffix="%" />
                    </h3>
                    {/* ── Vivid Status Badge ── */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 1.2, type: 'spring' as const, stiffness: 400, damping: 15 }}
                    >
                      <motion.span 
                        className="relative inline-flex items-center gap-1 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider text-white shadow-lg"
                        style={{ background: statusConfig.gradient, boxShadow: `0 4px 15px ${statusConfig.glow}` }}
                        animate={{ boxShadow: [`0 4px 15px ${statusConfig.glow}`, `0 4px 25px ${statusConfig.glow}`, `0 4px 15px ${statusConfig.glow}`] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                        {statusConfig.label}
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* Description */}
                  <motion.p 
                    className="text-[10px] text-gray-400 font-medium leading-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                  >
                    {statusConfig.desc}
                  </motion.p>
                </div>

                {/* Circular progress */}
                <AnimatedCircularProgress 
                  progress={loanReadiness} 
                  delay={0.8} 
                  size={80} 
                  strokeWidth={6}
                  color={statusConfig.color}
                  glowColor={statusConfig.glow}
                />
              </div>

              {/* Bottom progress bar */}
              <div className="mt-4">
                <AnimatedProgressBar progress={loanReadiness} color={statusConfig.color} delay={1.0} height="h-1.5" />
              </div>
            </motion.div>
          );
        })()}

        {/* ═══ Upcoming Bills ════════════════════════════════════ */}
        <motion.div 
          variants={cardSlideRight}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          className="glass rounded-[2.2rem] p-[var(--card-padding)] border theme-transition cursor-pointer transition-all"
          style={{ borderColor: 'var(--glass-border)' }}
          onClick={() => onNavigate?.('bills')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500/10"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1 }}
              >
                <Bell className="w-6 h-6 text-orange-400" />
              </motion.div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upcoming Bills</p>
                <p className="text-lg font-black mt-0.5" style={{ color: 'var(--text-color)' }}>
                  <AnimatedCounter value={upcomingBills} duration={0.8} /> bills totaling <span className="text-orange-400">₹<AnimatedCounter value={totalDue} duration={1.5} /></span>
                </p>
              </div>
            </div>
            <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ AI Wish Tracker ═══════════════════════════════════ */}
        <motion.div 
          variants={cardSlideRight}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          className="glass rounded-[2.2rem] p-[var(--card-padding)] border bg-gradient-to-r from-brand/5 to-amber-500/5 theme-transition cursor-pointer transition-all"
          style={{ borderColor: 'var(--glass-border)' }}
          onClick={() => onNavigate?.('wishes')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ backgroundColor: 'var(--brand-glow)' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                <Heart className="w-6 h-6 text-brand" />
              </motion.div>
              <div>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest">AI Wish Tracker</p>
                <p className="text-xs text-gray-400 mt-0.5 font-bold">iPhone 16 Pro in <span className="text-brand font-black">5 months</span> at current rate</p>
              </div>
            </div>
            <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ChevronRight className="w-5 h-5 text-brand" />
            </motion.div>
          </div>
        </motion.div>

        {/* ═══ AI Insight ════════════════════════════════════════ */}
        <motion.div 
          variants={cardSlideUp} 
          whileHover={{ scale: 1.01 }}
          className="glass rounded-[2.2rem] p-[var(--card-padding)] border flex gap-4 items-start theme-transition" 
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <motion.div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
            style={{ backgroundColor: 'var(--brand-glow)' }}
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          >
            <Sparkles className="w-6 h-6 text-brand" />
          </motion.div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">Flow AI Personality</p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm leading-relaxed font-medium italic" 
              style={{ color: 'var(--text-color)' }}
            >
              "{insight}"
            </motion.p>
          </div>
        </motion.div>

        {/* ─── Security & Reliability Oversight ─── */}
        <motion.section 
          variants={cardSlideUp}
          className="space-y-6"
        >
          <div className="flex flex-col items-center text-center gap-2">
             <div className="w-10 h-px bg-brand/20" />
             <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Institutional Grade Security</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Trust Marker 1 */}
             <div className="glass rounded-3xl p-5 border border-brand/5 flex flex-col items-center text-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                   <ShieldCheck className="w-5 h-5 text-brand" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-brand uppercase tracking-widest">RBI Regulated</p>
                   <p className="text-[8px] text-gray-500 font-bold uppercase">Compliance Node v2.1</p>
                </div>
             </div>

             {/* Trust Marker 2 */}
             <div className="glass rounded-3xl p-5 border border-brand/5 flex flex-col items-center text-center gap-3 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                   <Lock className="w-5 h-5 text-brand" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-brand uppercase tracking-widest">PCI-DSS Ready</p>
                   <p className="text-[8px] text-gray-500 font-bold uppercase">Encrypted Handshake</p>
                </div>
             </div>
          </div>

          {/* ─── Vivid Simulated Mode Footer ─── */}
          <div className="relative group mx-2">
             <div className="absolute inset-0 bg-brand/5 blur-xl rounded-[2rem] group-hover:bg-brand/10 transition-all duration-500" />
             <div className="relative glass rounded-[2rem] p-5 border-2 border-brand/10 flex items-center justify-between theme-transition">
                <div className="flex items-center gap-4">
                   <motion.div 
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 3 }}
                     className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand"
                   >
                      <Zap className="w-5 h-5" />
                   </motion.div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand">Vivid Simulation Active</p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">Sandbox Environment • No Real Money</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Live Monitor</span>
                </div>
             </div>
          </div>

          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center opacity-50">
             © 2026 FlowMint Technologies • All Rights Reserved
          </p>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Dashboard;
