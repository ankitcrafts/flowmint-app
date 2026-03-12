import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Gem, GraduationCap, Bike, Smartphone, Home,
  ChevronRight, Star, ShieldCheck, Zap, Lock, Calculator,
  TrendingUp, CheckCircle2, AlertCircle, X, Sparkles, Target
} from 'lucide-react';

interface LoanProduct {
  id: string;
  type: string;
  partner: string;
  icon: string;
  maxAmount: number;
  interestRate: number;
  maxTenure: number;
  eligible: boolean;
  eligibilityScore: number;
}

const LOAN_PRODUCTS: LoanProduct[] = [
  { id: '1', type: 'Personal Loan', partner: 'HDFC Bank', icon: 'briefcase', maxAmount: 1500000, interestRate: 9.25, maxTenure: 60, eligible: true, eligibilityScore: 85 },
  { id: '2', type: 'Consumer Durable', partner: 'Bajaj Finserv', icon: 'phone', maxAmount: 500000, interestRate: 11.0, maxTenure: 24, eligible: true, eligibilityScore: 92 },
  { id: '3', type: 'Bike Loan', partner: 'IDFC First', icon: 'bike', maxAmount: 300000, interestRate: 8.5, maxTenure: 48, eligible: true, eligibilityScore: 78 },
  { id: '4', type: 'Gold Loan', partner: 'Muthoot Finance', icon: 'gem', maxAmount: 5000000, interestRate: 8.0, maxTenure: 36, eligible: true, eligibilityScore: 95 },
  { id: '5', type: 'Education Loan', partner: 'ICICI Bank', icon: 'edu', maxAmount: 4000000, interestRate: 10.5, maxTenure: 84, eligible: false, eligibilityScore: 45 },
  { id: '6', type: 'Home Loan', partner: 'SBI', icon: 'home', maxAmount: 10000000, interestRate: 8.4, maxTenure: 360, eligible: false, eligibilityScore: 30 },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  briefcase: <Briefcase className="w-5 h-5 text-orange-400" />,
  phone: <Smartphone className="w-5 h-5 text-blue-400" />,
  bike: <Bike className="w-5 h-5 text-red-400" />,
  gem: <Gem className="w-5 h-5 text-yellow-400" />,
  edu: <GraduationCap className="w-5 h-5 text-amber-500" />,
  home: <Home className="w-5 h-5 text-cyan-400" />,
};

const LoanMarketplace: React.FC = () => {
  const [selectedLoan, setSelectedLoan] = useState<LoanProduct | null>(null);
  const [showEMICalc, setShowEMICalc] = useState(false);
  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(12);

  // Pre-qualification score based on simulated data
  const preQualScore = 72; // out of 100
  const creditScore = 782;
  const monthlyIncome = 50000;
  const existingEMI = 17999;

  const loanReadiness = useMemo(() => {
    if (preQualScore >= 80) return { label: 'High', color: 'var(--brand-primary)', bgColor: 'bg-brand/10 text-brand' };
    if (preQualScore >= 50) return { label: 'Moderate', color: '#F59E0B', bgColor: 'bg-yellow-500/10 text-yellow-400' };
    return { label: 'Basic', color: '#EF4444', bgColor: 'bg-red-500/10 text-red-400' };
  }, [preQualScore]);

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const r = rate / (12 * 100);
    if (r === 0) return principal / months;
    return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  };

  const simulatedEMI = selectedLoan
    ? calculateEMI(loanAmount, selectedLoan.interestRate, tenure)
    : calculateEMI(loanAmount, 10, tenure);

  const totalPayable = simulatedEMI * tenure;
  const totalInterest = totalPayable - loanAmount;
  const newEMIRatio = Math.round(((existingEMI + simulatedEMI) / monthlyIncome) * 100);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Loan Market</h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Discover • Compare • Apply when ready</p>
      </div>

      {/* Pre-Approved Hero */}
      <div className="p-8 mint-gradient rounded-[2.5rem] text-black relative overflow-hidden shadow-2xl theme-transition"
        style={{ boxShadow: '0 20px 40px var(--brand-glow)' }}>
        <div className="absolute top-0 right-0 p-6 opacity-20">
          <Zap className="w-32 h-32 rotate-12 fill-black" />
        </div>
        <div className="relative z-10">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-black/10 px-4 py-1.5 rounded-full">Pre-Approved for you</span>
          <h3 className="text-3xl font-black mt-6 tracking-tighter">₹5,00,000</h3>
          <p className="text-sm font-bold opacity-80 mt-1">Starting @ 9.25% interest</p>
          <button className="mt-8 w-full py-4 bg-black text-brand rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
            Check Eligibility
          </button>
        </div>
      </div>

      {/* Readiness & Score Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Credit</p>
          <h4 className="text-xl font-black mt-1 text-brand">{creditScore}</h4>
          <p className="text-[7px] font-black text-brand uppercase mt-0.5">Excellent</p>
        </div>
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Readiness</p>
          <h4 className="text-xl font-black mt-1" style={{ color: loanReadiness.color }}>{preQualScore}%</h4>
          <p className={`text-[7px] font-black uppercase mt-0.5 ${loanReadiness.bgColor} px-2 py-0.5 rounded-full inline-block`}>
            {loanReadiness.label}
          </p>
        </div>
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">EMI Load</p>
          <h4 className="text-xl font-black mt-1" style={{ color: (existingEMI / monthlyIncome * 100) > 40 ? '#F59E0B' : 'var(--brand-primary)' }}>
            {Math.round((existingEMI / monthlyIncome) * 100)}%
          </h4>
          <p className="text-[7px] font-black text-gray-500 uppercase mt-0.5">of income</p>
        </div>
      </div>

      {/* EMI Simulator */}
      <div className="glass rounded-[2rem] p-6 border theme-transition" style={{ borderColor: 'var(--brand-primary)', boxShadow: '0 0 30px var(--brand-glow)' }}>
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-brand" />
          <h3 className="font-black text-sm uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>EMI Simulator</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loan Amount</span>
              <span className="text-sm font-black" style={{ color: 'var(--text-color)' }}>₹{loanAmount.toLocaleString()}</span>
            </div>
            <input
              type="range" min="10000" max="2000000" step="10000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full accent-brand cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tenure</span>
              <span className="text-sm font-black" style={{ color: 'var(--text-color)' }}>{tenure} months</span>
            </div>
            <input
              type="range" min="3" max="60" step="3"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-brand cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Monthly EMI</p>
              <p className="text-lg font-black text-brand mt-1">₹{simulatedEMI.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Interest</p>
              <p className="text-lg font-black mt-1" style={{ color: 'var(--text-color)' }}>₹{totalInterest.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">New Load</p>
              <p className={`text-lg font-black mt-1 ${newEMIRatio > 50 ? 'text-red-400' : newEMIRatio > 35 ? 'text-yellow-400' : 'text-brand'}`}>
                {newEMIRatio}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Products */}
      <section className="space-y-4">
        <h3 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>Browse Loans</h3>
        <div className="space-y-3">
          {LOAN_PRODUCTS.map(loan => (
            <div
              key={loan.id}
              className={`flex items-center justify-between p-5 glass rounded-[1.8rem] border transition-all cursor-pointer group theme-transition ${!loan.eligible ? 'opacity-60' : ''}`}
              style={{ borderColor: 'var(--glass-border)' }}
              onClick={() => { setSelectedLoan(loan); setLoanAmount(Math.min(loan.maxAmount, loanAmount)); }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: 'var(--card-subtle)' }}>
                  {ICON_MAP[loan.icon]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>{loan.partner}</p>
                    <span className="text-[8px] px-2 py-0.5 rounded font-black uppercase" style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--text-color)' }}>
                      {loan.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                    Up to ₹{(loan.maxAmount / 100000).toFixed(0)}L
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-xs font-black text-brand tracking-tighter">{loan.interestRate}% p.a.</p>
                {loan.eligible ? (
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-brand/10 text-brand uppercase">
                    {loan.eligibilityScore}% match
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-500" />
                    <span className="text-[8px] font-black text-gray-500 uppercase">Not eligible yet</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Vivid Simulated Mode Indicator ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="relative group mt-8"
      >
        <div className="absolute inset-0 bg-brand/10 blur-2xl rounded-[2rem] group-hover:bg-brand/20 transition-all duration-500" />
        <div className="relative glass rounded-[2.2rem] p-6 border-2 border-brand/20 flex flex-col items-center text-center gap-4 theme-transition backdrop-blur-xl">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
              boxShadow: ["0 0 0px var(--brand-glow)", "0 0 20px var(--brand-glow)", "0 0 0px var(--brand-glow)"]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl bg-brand/20 flex items-center justify-center text-brand"
          >
            <ShieldCheck className="w-8 h-8" />
          </motion.div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-black uppercase tracking-widest text-brand">Vivid Simulation Active</span>
              <div className="px-2 py-0.5 rounded text-[8px] font-black bg-white/10 text-gray-500 uppercase tracking-tighter">Demo v1.0</div>
            </div>
            <p className="text-[11px] text-gray-400 font-bold leading-relaxed max-w-[280px] mx-auto">
              All NBFC partnerships and loan approvals are <span className="text-brand">simulated for this experience</span>. Live API integrations with regulated lenders are currently in sandbox.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-2 border-t border-brand/10 w-full justify-center">
             <div className="flex flex-col items-center gap-1">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">Security</p>
                <div className="flex items-center gap-1 text-[9px] font-black text-brand"><Lock className="w-2.5 h-2.5" /> 256-BIT</div>
             </div>
             <div className="w-px h-6 bg-brand/10" />
             <div className="flex flex-col items-center gap-1">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">Status</p>
                <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SANDBOX</div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoanMarketplace;
