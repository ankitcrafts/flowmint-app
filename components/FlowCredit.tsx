
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Shield, TrendingUp, CheckCircle2, AlertCircle, Clock, ExternalLink, Landmark,
  History, Sparkles, Plus, Minus, Info, RefreshCw, ChevronRight,
  CreditCard, Percent, BookOpen, AlertTriangle, HelpCircle, ChevronDown
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

const SCORE_HISTORY = [
  { month: 'Jul', score: 720 }, { month: 'Aug', score: 735 }, { month: 'Sep', score: 730 },
  { month: 'Oct', score: 755 }, { month: 'Nov', score: 770 }, { month: 'Dec', score: 782 },
];

interface CreditTip {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  status: 'done' | 'pending' | 'critical';
  actionLabel?: string;
}

const FlowCredit: React.FC = () => {
  const [brandColor, setBrandColor] = useState('#00FFA3');
  const [baseScore] = useState(782);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Simulation State
  const [payAmount, setPayAmount] = useState(0);
  const [newCard, setNewCard] = useState(false);
  const [onTimeStreak, setOnTimeStreak] = useState(false);
  const [closeOldAccount, setCloseOldAccount] = useState(false);

  useEffect(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();
    if (color) setBrandColor(color);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  // Simulation Logic
  const predictedScore = useMemo(() => {
    let score = baseScore;
    score += Math.min(35, Math.floor((payAmount / 25000) * 35));
    if (newCard) score -= 8;
    if (onTimeStreak) score += 12;
    if (closeOldAccount) score -= 15;
    return Math.min(900, Math.max(300, score));
  }, [baseScore, payAmount, newCard, onTimeStreak, closeOldAccount]);

  const scoreDelta = predictedScore - baseScore;

  const creditTips: CreditTip[] = [
    {
      id: '1',
      category: 'UTILIZATION',
      title: 'Reduce Credit Card Usage',
      description: 'Your HDFC usage is at 42%. Aim for <30% to gain approximately 15-20 points.',
      impact: 'High',
      status: 'pending',
      actionLabel: 'Check Usage'
    },
    {
      id: '2',
      category: 'PAYMENT HISTORY',
      title: 'Enable Auto-Pay for ICICI Loan',
      description: 'Ensuring 100% on-time payments is the biggest factor for your "Excellent" status.',
      impact: 'High',
      status: 'critical',
      actionLabel: 'Set Auto-pay'
    }
  ];

  // Gauge constants - Refined for a 240 degree arc
  const size = 220;
  const strokeWidth = 16;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  // Total arc is 240 degrees (2/3 circle)
  const arcDegrees = 240;
  const totalLength = (2 * Math.PI * radius * arcDegrees) / 360;
  
  // Calculate dash offset based on score (300-900)
  const scoreRatio = (baseScore - 300) / 600;
  const currentProgress = totalLength * scoreRatio;
  const dashOffset = totalLength - currentProgress;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Premium Credit Score Card */}
      <div className="glass rounded-[2.5rem] p-8 border theme-transition relative overflow-hidden group" 
           style={{ borderColor: 'var(--glass-border)' }}>
        
        {/* Background Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="flex justify-between w-full mb-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Experian Report</span>
            <button onClick={handleRefresh} className="p-1 hover:text-brand transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin text-brand' : ''}`} />
            </button>
          </div>

          <div className="relative w-64 h-56 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg width={size} height={size} className="transform rotate-[150deg]">
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor={brandColor} />
                </linearGradient>
                <filter id="arcGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background Track Arc */}
              <circle 
                cx={center} cy={center} r={radius} 
                stroke="var(--glass-border)" 
                strokeWidth={strokeWidth} 
                fill="transparent" 
                strokeDasharray={`${totalLength} ${2 * Math.PI * radius}`}
                strokeLinecap="round"
              />
              
              {/* Active Progress Arc */}
              <circle 
                cx={center} cy={center} r={radius} 
                stroke="url(#arcGradient)" 
                strokeWidth={strokeWidth} 
                fill="transparent" 
                strokeDasharray={`${totalLength} ${2 * Math.PI * radius}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round" 
                className="transition-all duration-1500 ease-out"
                filter="url(#arcGlow)"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className={`text-6xl font-black tracking-tighter transition-all duration-500 ${isRefreshing ? 'scale-90 opacity-50' : 'scale-100'}`} style={{ color: 'var(--text-color)' }}>
                {isRefreshing ? '---' : baseScore}
              </span>
              <div className="mt-2 px-4 py-1.5 rounded-full border border-brand/30 bg-brand/10 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,163,0.1)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                <span className="text-[10px] font-black text-brand tracking-[0.1em] uppercase">Excellent</span>
              </div>
            </div>
          </div>

          <div className="mt-4 w-full flex flex-col items-center gap-6">
            <div className="rounded-2xl px-6 py-2.5 flex items-center gap-3 border theme-transition" style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}>
              <TrendingUp className="w-4 h-4 text-brand" />
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">+12 Points <span className="opacity-30 ml-1">vs Nov</span></span>
            </div>
            
            <button className="flex items-center gap-2 text-brand text-[11px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
              View Detailed Analysis <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Small Bottom Chart */}
        <div className="mt-12 h-12 w-full opacity-30">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={SCORE_HISTORY}>
               <Area type="monotone" dataKey="score" stroke={brandColor} strokeWidth={2} fill="transparent" />
             </AreaChart>
           </ResponsiveContainer>
        </div>
        <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em] text-center mt-3">6-Month Score Trajectory</p>
      </div>

      {/* Manual/Estimated Score Label */}
      <div className="flex items-center justify-center gap-2 py-2">
        <Info className="w-3 h-3 text-gray-500" />
        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Manual / Estimated Score – Bureau integration coming soon</span>
      </div>

      {/* Credit Behavior Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <CreditCard className="w-5 h-5 text-orange-400 mx-auto mb-2" />
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Utilization</p>
          <h4 className="text-xl font-black mt-1 text-orange-400">42%</h4>
          <p className="text-[7px] font-black text-orange-400 uppercase mt-0.5">Aim &lt;30%</p>
        </div>
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <Percent className="w-5 h-5 text-brand mx-auto mb-2" />
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">EMI/Income</p>
          <h4 className="text-xl font-black mt-1 text-brand">36%</h4>
          <p className="text-[7px] font-black text-brand uppercase mt-0.5">Moderate</p>
        </div>
        <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <AlertTriangle className="w-5 h-5 text-brand mx-auto mb-2" />
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Late Pays</p>
          <h4 className="text-xl font-black mt-1" style={{ color: 'var(--brand-primary)' }}>0</h4>
          <p className="text-[7px] font-black text-brand uppercase mt-0.5">Excellent</p>
        </div>
      </div>

      {/* Credit Education Module */}
      <CreditEducation />

      {/* WHAT IF SIMULATOR */}
      <section className="glass rounded-[2.5rem] p-8 border theme-transition relative overflow-hidden" style={{ borderColor: 'var(--brand-primary)', boxShadow: '0 0 40px var(--brand-glow)' }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>What If...</h3>
            <p className="text-[10px] text-brand font-black uppercase mt-1 tracking-widest">Scenario Simulator</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none">Predicted</p>
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <h2 className="text-3xl font-black transition-all" style={{ color: 'var(--text-color)' }}>{predictedScore}</h2>
              {scoreDelta !== 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${scoreDelta > 0 ? 'bg-brand/10 text-brand' : 'bg-red-500/10 text-red-500'}`}>
                  {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Debt Repayment Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Pay off Debt</label>
              <span className="text-sm font-black" style={{ color: 'var(--text-color)' }}>₹{payAmount.toLocaleString()}</span>
            </div>
            <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
               <div className="absolute inset-y-0 left-0 bg-brand shadow-[0_0_10px_var(--brand-glow)]" style={{ width: `${(payAmount/25000)*100}%` }}></div>
               <input 
                  type="range" 
                  min="0" max="25000" step="1000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
            </div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-500">
               <span>₹0</span>
               <span className="text-brand">+{Math.min(35, Math.floor((payAmount / 25000) * 35))} PTS</span>
               <span>₹25k</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SimulatorToggle 
              active={newCard} 
              onToggle={() => setNewCard(!newCard)} 
              label="New Card" 
              icon={<Plus className="w-4 h-4" />}
              sub="-8 pts inquiry"
            />
            <SimulatorToggle 
              active={onTimeStreak} 
              onToggle={() => setOnTimeStreak(!onTimeStreak)} 
              label="Loyalty" 
              icon={<CheckCircle2 className="w-4 h-4" />}
              sub="+12 pts streak"
            />
          </div>

          <SimulatorToggle 
              active={closeOldAccount} 
              onToggle={() => setCloseOldAccount(!closeOldAccount)} 
              label="Close Old Account" 
              icon={<Minus className="w-4 h-4" />}
              sub="-15 pts age impact"
              full
            />
        </div>

        <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl border theme-transition" style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}>
          <Info className="w-5 h-5 text-gray-500 shrink-0" />
          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
            AI-modeled prediction based on Experian data structures. Actual scores may vary.
          </p>
        </div>
      </section>

      {/* Actionable Tips */}
      <section className="space-y-4">
        <h3 className="font-black text-lg px-2" style={{ color: 'var(--text-color)' }}>Master Strategy</h3>
        <div className="space-y-4">
          {creditTips.map((tip) => (
            <DetailedTipCard key={tip.id} tip={tip} />
          ))}
        </div>
      </section>

      <div className="p-6 glass rounded-[2rem] border theme-transition group" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand/10"><Shield className="w-6 h-6 text-brand" /></div>
            <div>
              <h4 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Official Credit Registry</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-tighter">Verified RBI Data Provider</p>
            </div>
          </div>
          <button className="p-3 glass rounded-xl text-brand group-hover:scale-110 transition-transform"><ExternalLink className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

// Credit Education Module
const CreditEducation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const factors = [
    { label: 'Payment History', weight: 35, color: '#00FFA3', desc: 'Paying EMIs and credit card bills on time is the #1 factor.' },
    { label: 'Credit Utilization', weight: 30, color: '#F59E0B', desc: 'Keep your credit card usage below 30% of your total limit.' },
    { label: 'Credit Age', weight: 15, color: '#3B82F6', desc: 'Older accounts show stability. Avoid closing old cards.' },
    { label: 'Credit Mix', weight: 10, color: '#8B5CF6', desc: 'Having a mix of secured (home/car) and unsecured (card) credit helps.' },
    { label: 'New Inquiries', weight: 10, color: '#EF4444', desc: 'Too many loan applications in short time hurts your score.' },
  ];

  return (
    <div className="glass rounded-[2rem] border overflow-hidden theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <h4 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>What Affects Your Score?</h4>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">Credit education</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="h-px" style={{ backgroundColor: 'var(--glass-border)' }}></div>
          {factors.map((factor) => (
            <div key={factor.label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black" style={{ color: 'var(--text-color)' }}>{factor.label}</span>
                <span className="text-xs font-black" style={{ color: factor.color }}>{factor.weight}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${factor.weight}%`, backgroundColor: factor.color }}></div>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{factor.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Properly typed functional component to avoid potential prop assignment issues
const SimulatorToggle: React.FC<{ active: boolean, onToggle: () => void, label: string, icon: React.ReactNode, sub: string, full?: boolean }> = ({ active, onToggle, label, icon, sub, full }) => (
  <button 
    onClick={onToggle}
    className={`flex flex-col gap-1 p-5 rounded-[2rem] border transition-all text-left theme-transition ${full ? 'w-full' : ''}`}
    style={{
      backgroundColor: active ? 'var(--brand-glow)' : 'var(--card-subtle)',
      borderColor: active ? 'var(--brand-primary)' : 'var(--glass-border)',
      boxShadow: active ? '0 0 15px var(--brand-glow)' : 'none',
    }}
  >
    <div className="flex items-center justify-between w-full mb-1">
      <div className={`${active ? 'text-brand' : 'text-gray-500'}`}>{icon}</div>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${active ? 'bg-brand' : ''}`} style={{ backgroundColor: active ? undefined : 'var(--glass-border)' }}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${active ? 'left-[18px] bg-white' : 'left-0.5'}`} style={{ backgroundColor: active ? undefined : 'var(--text-secondary, #9ca3af)' }}></div>
      </div>
    </div>
    <p className={`text-[10px] font-black uppercase tracking-[0.1em]`} style={{ color: active ? 'var(--text-color)' : 'var(--text-secondary, #9ca3af)' }}>{label}</p>
    <p className="text-[9px] text-gray-500 font-bold opacity-60 uppercase tracking-tight">{sub}</p>
  </button>
);

// Fix for DetailedTipCard props by using React.FC to allow 'key' prop when used in map
const DetailedTipCard: React.FC<{ tip: CreditTip }> = ({ tip }) => {
  const impactColor = tip.impact === 'High' ? 'text-orange-500' : 'text-blue-400';
  const statusIcon = tip.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-brand" /> : <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />;

  return (
    <div className="glass p-6 rounded-[2rem] border theme-transition hover:translate-x-1 transition-all" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[9px] font-black tracking-[0.2em] text-brand uppercase">{tip.category}</span>
        <div className="flex items-center gap-1.5">
          <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-white/5 ${impactColor}`}>
            {tip.impact} Impact
          </div>
          {statusIcon}
        </div>
      </div>
      <h4 className="font-bold text-sm tracking-tight mb-1" style={{ color: 'var(--text-color)' }}>{tip.title}</h4>
      <p className="text-[11px] leading-relaxed text-gray-500 font-medium mb-5">{tip.description}</p>
      {tip.actionLabel && (
        <button className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all active:scale-[0.98] theme-transition" style={{ color: 'var(--text-color)', backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}>
          {tip.actionLabel}
        </button>
      )}
    </div>
  );
};

export default FlowCredit;
