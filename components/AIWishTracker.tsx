
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Smartphone, Plane, Bike, GraduationCap, Gem, Shirt, Camera,
  Clock, Plus, X, Heart, Zap, Target, Star, Bookmark, BookmarkCheck,
  History, Loader2, TrendingUp,
  ArrowRight, RefreshCw, CheckCircle2, Shield, Cpu, Brain, ChevronDown
} from 'lucide-react';
import { llmService } from '../services/llmService';
import type { WishPlanResponse, ConversationSummary } from '../services/llmService';

// ─── Types ────────────────────────────────────────────────

interface Wish {
  id: string;
  name: string;
  price: number;
  icon: string;
  monthsToAfford: number;
  savedSoFar: number;
  aiTip: string;
  speedUpTip: string;
  savingSteps: string[];
  priority: 'high' | 'medium' | 'low';
  conversationId?: string;
  isAiGenerated: boolean;
  provider?: string;
  model?: string;
  responseTimeMs?: number;
}

// ─── Constants ────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  phone: <Smartphone className="w-6 h-6 text-brand" />,
  plane: <Plane className="w-6 h-6 text-cyan-400" />,
  bike: <Bike className="w-6 h-6 text-red-400" />,
  education: <GraduationCap className="w-6 h-6 text-yellow-400" />,
  luxury: <Gem className="w-6 h-6 text-amber-500" />,
  fashion: <Shirt className="w-6 h-6 text-pink-400" />,
  camera: <Camera className="w-6 h-6 text-orange-400" />,
};

const ICON_OPTIONS = [
  { key: 'phone', label: 'Phone', icon: <Smartphone className="w-5 h-5" /> },
  { key: 'plane', label: 'Travel', icon: <Plane className="w-5 h-5" /> },
  { key: 'bike', label: 'Vehicle', icon: <Bike className="w-5 h-5" /> },
  { key: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" /> },
  { key: 'luxury', label: 'Luxury', icon: <Gem className="w-5 h-5" /> },
  { key: 'fashion', label: 'Fashion', icon: <Shirt className="w-5 h-5" /> },
  { key: 'camera', label: 'Gadget', icon: <Camera className="w-5 h-5" /> },
];

const PROVIDER_INFO: Record<string, { label: string; color: string; icon: React.ReactNode; gradient: string }> = {
  groq: {
    label: 'Llama 3.3',
    color: '#f97316',
    icon: <Brain className="w-3 h-3" />,
    gradient: 'from-orange-500/10 to-amber-500/5',
  },
  gemini: {
    label: 'Gemini',
    color: '#4285f4',
    icon: <Sparkles className="w-3 h-3" />,
    gradient: 'from-blue-500/10 to-cyan-500/5',
  },
  local: {
    label: 'Smart Math',
    color: '#9ca3af',
    icon: <Cpu className="w-3 h-3" />,
    gradient: 'from-gray-500/10 to-gray-500/5',
  },
};

const LOADING_MESSAGES = [
  'Analyzing your financial profile...',
  'Crunching the numbers with AI...',
  'Building your personalized plan...',
  'Finding the fastest path to your goal...',
  'Optimizing your saving strategy...',
];

// ─── Provider Badge Component ─────────────────────────────

const ProviderBadge: React.FC<{ provider?: string; model?: string; responseTimeMs?: number }> = ({ provider, model, responseTimeMs }) => {
  const info = PROVIDER_INFO[provider || 'local'] || PROVIDER_INFO.local;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider"
      style={{ backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}25` }}
    >
      {info.icon}
      <span>{info.label}</span>
      {responseTimeMs && (
        <>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ opacity: 0.7 }}>{responseTimeMs}ms</span>
        </>
      )}
    </motion.div>
  );
};

// ─── Typing Effect Hook ───────────────────────────────────

function useTypingEffect(text: string, speed: number = 20, enabled: boolean = true): string {
  const [displayed, setDisplayed] = useState('');
  const prevText = useRef('');

  useEffect(() => {
    if (!enabled || text === prevText.current) return;
    prevText.current = text;
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return enabled ? displayed : text;
}

// ─── Animated Counter ─────────────────────────────────────

const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1000 }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{displayed.toLocaleString()}</>;
};

// ─── Pulse Dot ────────────────────────────────────────────

const PulseDot: React.FC<{ color?: string }> = ({ color = 'var(--brand-primary)' }) => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }}></span>
  </span>
);

// ─── Main Component ───────────────────────────────────────

const AIWishTracker: React.FC = () => {
  // Core state
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wishes' | 'history'>('wishes');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Add wish modal
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newIcon, setNewIcon] = useState('luxury');
  const [newSavedSoFar, setNewSavedSoFar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  // Usage & history
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Ratings
  const [ratingWishId, setRatingWishId] = useState<string | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [ratedWishes, setRatedWishes] = useState<Record<string, number>>({});

  // Computed
  const totalWishValue = useMemo(() => wishes.reduce((s, w) => s + w.price, 0), [wishes]);
  const totalSaved = useMemo(() => wishes.reduce((s, w) => s + w.savedSoFar, 0), [wishes]);

  // Cycle loading messages
  useEffect(() => {
    if (!isGenerating) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // ─── Load history when tab switches ──────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await llmService.getHistory('wish_plan', 20);
      setHistory(data.conversations);
    } catch {
      // Silent fail
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  // ─── Add wish with AI plan generation ────────────────
  const handleAdd = async () => {
    if (!newName || !newPrice) return;
    const price = parseInt(newPrice);
    const savedSoFar = parseInt(newSavedSoFar) || 0;

    setIsGenerating(true);

    try {
      const plan: WishPlanResponse = await llmService.getWishPlan({
        wishName: newName,
        price,
        currentSavings: savedSoFar,
        monthlyIncome: 60000,
        monthlyExpenses: 38000,
        existingEMIs: 5000,
        topSpendingCategories: ['Food Delivery', 'Shopping', 'Subscriptions'],
      });

      const wish: Wish = {
        id: Date.now().toString(),
        name: newName,
        price,
        icon: newIcon,
        monthsToAfford: plan.monthsToAfford,
        savedSoFar,
        aiTip: plan.aiTip,
        speedUpTip: plan.speedUpTip,
        savingSteps: plan.savingSteps || [],
        priority: price > 100000 ? 'low' : price > 40000 ? 'medium' : 'high',
        conversationId: plan.conversationId,
        isAiGenerated: !plan.fallback,
        provider: plan.provider,
        model: plan.model,
        responseTimeMs: plan.responseTimeMs,
      };

      setWishes([wish, ...wishes]);
      setNewName('');
      setNewPrice('');
      setNewSavedSoFar('');
      setNewIcon('luxury');
      setShowAdd(false);
      setExpandedId(wish.id);
      setNewlyAddedId(wish.id);
      setTimeout(() => setNewlyAddedId(null), 3000);
    } catch {
      const months = Math.ceil((price - savedSoFar) / 14000);
      const wish: Wish = {
        id: Date.now().toString(),
        name: newName,
        price,
        icon: newIcon,
        monthsToAfford: months,
        savedSoFar,
        aiTip: `At current savings, you can afford this in ~${months} months.`,
        speedUpTip: 'Reduce discretionary spending to speed up.',
        savingSteps: ['Set up auto-save on salary day', 'Cut food delivery by 30%', 'Audit subscriptions'],
        priority: price > 100000 ? 'low' : price > 40000 ? 'medium' : 'high',
        isAiGenerated: false,
        provider: 'local',
        model: 'fallback-math',
      };
      setWishes([wish, ...wishes]);
      setShowAdd(false);
    }

    setIsGenerating(false);
  };

  // ─── Rate a conversation ─────────────────────────────
  const handleRate = async (wishId: string, conversationId: string, rating: number) => {
    try {
      await llmService.rateConversation(conversationId, rating);
      setRatedWishes(prev => ({ ...prev, [wishId]: rating }));
      setRatingWishId(null);
    } catch {
      // Silent fail
    }
  };

  // ─── Bookmark a conversation ─────────────────────────
  const handleBookmark = async (wishId: string, conversationId: string, isBookmarked: boolean) => {
    try {
      await llmService.toggleBookmark(conversationId, !isBookmarked);
      setWishes(prev => prev.map(w =>
        w.id === wishId ? { ...w, isBookmarked: !isBookmarked } : w
      ));
    } catch {
      // Silent fail
    }
  };

  // ─── Restore a wish from history ─────────────────────
  const restoreFromHistory = (conv: ConversationSummary) => {
    const ctx = conv.input_context as any;
    const resp = conv.ai_response as any;
    const wish: Wish = {
      id: `history-${conv.id}`,
      name: ctx.wishName || 'Restored Wish',
      price: ctx.price || 0,
      icon: 'luxury',
      monthsToAfford: resp.monthsToAfford || 0,
      savedSoFar: ctx.currentSavings || 0,
      aiTip: resp.aiTip || '',
      speedUpTip: resp.speedUpTip || '',
      savingSteps: resp.savingSteps || [],
      priority: (ctx.price || 0) > 100000 ? 'low' : (ctx.price || 0) > 40000 ? 'medium' : 'high',
      conversationId: conv.id,
      isAiGenerated: true,
    };

    if (!wishes.find(w => w.conversationId === conv.id)) {
      setWishes(prev => [wish, ...prev]);
    }
    setActiveTab('wishes');
    setExpandedId(wish.id);
  };

  // ─── Animation Variants ──────────────────────────────
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 200, damping: 20 },
    }),
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: 'auto', opacity: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
    exit: { height: 0, opacity: 0, transition: { duration: 0.25 } },
  };

  const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { y: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' as const } },
  };

  return (
    <div className="space-y-6">
      {/* ── Header with animated gradient ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Wish Tracker</h2>
          <div className="flex items-center gap-2 mt-1">
            <PulseDot />
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
              <span className="text-brand">AI-powered</span> • Llama 3.3 + Gemini • Turn wants into plans
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 bg-brand rounded-2xl text-black flex items-center justify-center shadow-lg"
          style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* ── Tabs with animated indicator ──────────────────── */}
      <div className="flex gap-2 relative">
        {(['wishes', 'history'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors ${
              activeTab === tab ? 'bg-brand text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeTab === tab ? { boxShadow: '0 4px 15px var(--brand-glow)' } : { backgroundColor: 'var(--card-subtle)' }}
          >
            {tab === 'wishes' ? (
              <><Target className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />My Wishes ({wishes.length})</>
            ) : (
              <><History className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Past Plans</>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── AI Provider Status Banner ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-[2rem] p-5 border bg-gradient-to-r from-brand/5 via-amber-500/5 to-yellow-500/5 theme-transition"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative" style={{ backgroundColor: 'var(--brand-glow)' }}>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <Shield className="w-6 h-6 text-brand" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">Smart AI Fallback</p>
            <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
              Groq (Llama 3.3) → Gemini → Smart Math. You'll always get an answer — no cap.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            {Object.entries(PROVIDER_INFO).map(([key, info]) => (
              <div key={key} className="flex items-center gap-1 text-[7px] font-black uppercase tracking-wider" style={{ color: info.color }}>
                {info.icon} {info.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>


      {/* ══════════════════════════════════════════════════ */}
      {/* ── WISHES TAB ───────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
      {activeTab === 'wishes' && (
        <motion.div key="wishes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Summary Cards */}
          {wishes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4 mb-5"
            >
              <div className="glass rounded-[2rem] p-5 border theme-transition relative overflow-hidden" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand/5 rounded-full -mr-8 -mt-8"></div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Wishlist</p>
                <h3 className="text-xl font-black mt-2 tracking-tighter" style={{ color: 'var(--text-color)' }}>
                  ₹<AnimatedNumber value={totalWishValue} />
                </h3>
                <p className="text-[9px] font-black text-gray-500 mt-1 uppercase">{wishes.length} items</p>
              </div>
              <div className="glass rounded-[2rem] p-5 border theme-transition relative overflow-hidden" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand/5 rounded-full -mr-8 -mt-8"></div>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Progress</p>
                <h3 className="text-xl font-black mt-2 tracking-tighter text-brand">
                  ₹<AnimatedNumber value={totalSaved} />
                </h3>
                <p className="text-[9px] font-black text-brand mt-1 uppercase">
                  {totalWishValue > 0 ? Math.round((totalSaved / totalWishValue) * 100) : 0}% saved
                </p>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {wishes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="glass rounded-[2rem] p-10 border text-center theme-transition mb-5"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--brand-glow)' }}
              >
                <Sparkles className="w-8 h-8 text-brand" />
              </motion.div>
              <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-color)' }}>What's on your wishlist?</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto">
                Add your first wish and let FlowMint AI create a personalized saving plan powered by Llama 3.3 and Gemini.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="mt-6 px-8 py-3.5 bg-brand text-black rounded-2xl text-[10px] font-black uppercase tracking-widest"
                style={{ boxShadow: '0 8px 25px var(--brand-glow)' }}
              >
                <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Add First Wish
              </motion.button>
            </motion.div>
          )}

          {/* Wish Cards */}
          <div className="space-y-4">
            <AnimatePresence>
              {wishes.map((wish, index) => {
                const progress = wish.price > 0 ? Math.round((wish.savedSoFar / wish.price) * 100) : 0;
                const isExpanded = expandedId === wish.id;
                const isNew = newlyAddedId === wish.id;

                return (
                  <motion.div
                    key={wish.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={`glass rounded-[2rem] border overflow-hidden theme-transition ${isNew ? 'ring-2 ring-brand/40' : ''}`}
                    style={{ borderColor: isExpanded ? 'var(--brand-primary)' : 'var(--glass-border)' }}
                  >
                    {/* Newly Added Glow Effect */}
                    {isNew && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 3 }}
                        className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none rounded-[2rem]"
                      />
                    )}

                    {/* Card Header — Clickable */}
                    <motion.button
                      onClick={() => setExpandedId(isExpanded ? null : wish.id)}
                      className="w-full p-6 text-left relative"
                      whileTap={{ scale: 0.995 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--card-subtle)' }}
                          >
                            {ICON_MAP[wish.icon] || <Gem className="w-6 h-6 text-gray-400" />}
                          </motion.div>
                          <div>
                            <h4 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>{wish.name}</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">₹{wish.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-black" style={{ color: 'var(--text-color)' }}>{wish.monthsToAfford}mo</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase inline-block ${wish.priority === 'high' ? 'bg-brand/10 text-brand' : wish.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                              {wish.priority}
                            </span>
                            {wish.provider && (
                              <ProviderBadge provider={wish.provider} />
                            )}
                          </div>
                          {/* Chevron indicator */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-1 flex justify-end"
                          >
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                          <span>{progress}% saved</span>
                          <span style={{ color: 'var(--text-color)' }}>₹{wish.savedSoFar.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            className="h-full bg-brand rounded-full shadow-[0_0_10px_var(--brand-glow)]"
                          />
                        </div>
                      </div>
                    </motion.button>

                    {/* ── Expanded AI Section ──────────────────── */}
                    <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        variants={expandVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 space-y-4">
                          <div className="h-px" style={{ backgroundColor: 'var(--glass-border)' }}></div>

                          {/* Provider + Response Time */}
                          {wish.provider && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2"
                            >
                              <ProviderBadge provider={wish.provider} model={wish.model} responseTimeMs={wish.responseTimeMs} />
                              {wish.isAiGenerated && (
                                <span className="text-[8px] font-black px-2 py-1 rounded-full uppercase bg-green-500/10 text-green-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> AI Generated
                                </span>
                              )}
                            </motion.div>
                          )}

                          {/* AI Prediction */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={`flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r ${PROVIDER_INFO[wish.provider || 'local']?.gradient || ''}`}
                            style={{ backgroundColor: 'var(--card-subtle)' }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-glow)' }}>
                              <Sparkles className="w-4 h-4 text-brand" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1">FlowMint AI Says</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-color)' }}>{wish.aiTip}</p>
                            </div>
                          </motion.div>

                          {/* Speed Up Tip */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5"
                          >
                            <motion.div
                              animate={{ rotate: [0, 15, -15, 0] }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 shrink-0"
                            >
                              <Zap className="w-4 h-4 text-amber-500" />
                            </motion.div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">⚡ Speed Up</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-color)' }}>{wish.speedUpTip}</p>
                            </div>
                          </motion.div>

                          {/* Saving Steps */}
                          {wish.savingSteps.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="p-4 rounded-2xl space-y-3"
                              style={{ backgroundColor: 'var(--card-subtle)' }}
                            >
                              <p className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" /> Action Plan
                              </p>
                              {wish.savingSteps.map((step, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -15 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.35 + i * 0.1 }}
                                  className="flex items-start gap-3"
                                >
                                  <motion.div
                                    whileHover={{ scale: 1.2 }}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-brand/10 text-brand text-[10px] font-black mt-0.5"
                                  >
                                    {i + 1}
                                  </motion.div>
                                  <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-color)' }}>{step}</p>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}

                          {/* Action Row: Rate + Bookmark */}
                          {wish.conversationId && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="flex items-center justify-between pt-2"
                            >
                              {/* Rating Stars */}
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mr-2">Rate:</span>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <motion.button
                                    key={star}
                                    onClick={() => handleRate(wish.id, wish.conversationId!, star)}
                                    onMouseEnter={() => { setRatingWishId(wish.id); setHoverStar(star); }}
                                    onMouseLeave={() => setHoverStar(0)}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.8, rotate: 20 }}
                                  >
                                    <Star className={`w-5 h-5 transition-colors ${
                                      (ratedWishes[wish.id] && star <= ratedWishes[wish.id])
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : (ratingWishId === wish.id && hoverStar >= star)
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-600'
                                    }`} />
                                  </motion.button>
                                ))}
                                {ratedWishes[wish.id] && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[9px] font-black text-yellow-400 ml-1"
                                  >
                                    ✓ Saved
                                  </motion.span>
                                )}
                              </div>

                              {/* Bookmark */}
                              <motion.button
                                onClick={() => handleBookmark(wish.id, wish.conversationId!, false)}
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-xl transition-colors hover:bg-brand/10"
                              >
                                <Bookmark className="w-4 h-4 text-gray-500 hover:text-brand" />
                              </motion.button>
                            </motion.div>
                          )}

                          {/* Add Funds Button */}
                          <motion.button
                            whileHover={{ scale: 1.01, borderColor: 'var(--brand-primary)' }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all theme-transition"
                            style={{ color: 'var(--text-color)', backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
                          >
                            Add Funds to This Wish
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── HISTORY TAB ──────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          {/* Refresh button */}
          <div className="flex justify-end">
            <motion.button
              onClick={loadHistory}
              disabled={historyLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand transition-colors"
              style={{ backgroundColor: 'var(--card-subtle)' }}
            >
              <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>

          {historyLoading && history.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-[2rem] p-10 border text-center"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-4">Loading your AI plans...</p>
            </motion.div>
          )}

          {!historyLoading && history.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[2rem] p-10 border text-center"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <History className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-sm font-bold mt-4" style={{ color: 'var(--text-color)' }}>No history yet</p>
              <p className="text-xs text-gray-500 mt-2">Your AI-generated saving plans will appear here.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {history.map((conv, i) => {
              const ctx = conv.input_context as any;
              const resp = conv.ai_response as any;
              const date = new Date(conv.created_at);
              const timeAgo = getTimeAgo(date);

              return (
                <motion.div
                  key={conv.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="glass rounded-[2rem] p-5 border theme-transition hover:border-brand/30 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--glass-border)' }}
                  onClick={() => restoreFromHistory(conv)}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--card-subtle)' }}
                      >
                        <Sparkles className="w-5 h-5 text-brand" />
                      </motion.div>
                      <div>
                        <h4 className="text-sm font-black tracking-tight" style={{ color: 'var(--text-color)' }}>
                          {conv.title || ctx?.wishName || 'Saving Plan'}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                          ₹{(ctx?.price || 0).toLocaleString()} • {timeAgo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conv.user_rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] font-black text-yellow-400">{conv.user_rating}</span>
                        </div>
                      )}
                      {conv.is_bookmarked && (
                        <BookmarkCheck className="w-4 h-4 text-brand" />
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  {resp?.aiTip && (
                    <p className="text-[11px] text-gray-400 mt-3 line-clamp-2 leading-relaxed pl-[52px]">
                      {resp.aiTip}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── ADD WISH MODAL ───────────────────────────────── */}
      {/* ══════════════════════════════════════════════════ */}
      <AnimatePresence>
      {showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) setShowAdd(false); }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md rounded-t-[2.5rem] p-8 space-y-5"
            style={{ backgroundColor: 'var(--bg-color)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Add a Wish</h3>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">AI will create a personalized saving plan</p>
              </div>
              <motion.button
                onClick={() => !isGenerating && setShowAdd(false)}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.8 }}
                className="p-2 rounded-xl"
                style={{ backgroundColor: 'var(--card-subtle)' }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Icon Selector */}
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Category</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {ICON_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.key}
                    onClick={() => setNewIcon(opt.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl min-w-[64px] transition-all ${
                      newIcon === opt.key ? 'bg-brand/10 text-brand border-brand/30' : 'text-gray-500 border-transparent hover:text-gray-300'
                    } border`}
                    style={newIcon !== opt.key ? { backgroundColor: 'var(--card-subtle)' } : {}}
                  >
                    {opt.icon}
                    <span className="text-[8px] font-black uppercase">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <input
              placeholder="What do you wish for?"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition focus:border-brand/50"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
              disabled={isGenerating}
            />
            <input
              placeholder="Cost (₹)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ''))}
              type="tel"
              className="w-full h-14 px-5 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition focus:border-brand/50"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
              disabled={isGenerating}
            />
            <input
              placeholder="Already saved? (₹) — optional"
              value={newSavedSoFar}
              onChange={(e) => setNewSavedSoFar(e.target.value.replace(/\D/g, ''))}
              type="tel"
              className="w-full h-14 px-5 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition focus:border-brand/50"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
              disabled={isGenerating}
            />

            {/* AI Preview */}
            {newPrice && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-2"
              >
                <Sparkles className="w-3 h-3 text-brand" />
                <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                  AI will calculate the fastest path to ₹{parseInt(newPrice || '0').toLocaleString()}
                </span>
              </motion.div>
            )}

            {/* Generating Indicator — Enhanced */}
            <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 rounded-2xl bg-gradient-to-r from-brand/5 via-amber-500/5 to-yellow-500/5 border border-brand/20 space-y-3">
                  {/* Animated loader */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Loader2 className="w-6 h-6 text-brand" />
                      </motion.div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-brand uppercase tracking-widest">FlowMint AI is thinking...</p>
                      <motion.p
                        key={loadingMessage}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[9px] text-gray-500 mt-0.5"
                      >
                        {loadingMessage}
                      </motion.p>
                    </div>
                  </div>

                  {/* Provider chain visualization */}
                  <div className="flex items-center gap-1.5 pl-9">
                    <span className="text-[7px] font-black uppercase tracking-wider text-orange-400">Llama 3.3</span>
                    <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                    <span className="text-[7px] font-black uppercase tracking-wider text-brand">Gemini</span>
                    <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                    <span className="text-[7px] font-black uppercase tracking-wider text-gray-400">Smart Math</span>
                  </div>

                  {/* Animated progress bar */}
                  <div className="h-1 w-full rounded-full overflow-hidden bg-gray-800 ml-0">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: ['0%', '35%', '60%', '85%', '95%'] }}
                      transition={{ duration: 8, times: [0, 0.2, 0.5, 0.8, 1], ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-brand via-amber-400 to-yellow-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              onClick={handleAdd}
              disabled={!newName || !newPrice || isGenerating}
              whileHover={!newName || !newPrice || isGenerating ? {} : { scale: 1.02 }}
              whileTap={!newName || !newPrice || isGenerating ? {} : { scale: 0.98 }}
              className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                !newName || !newPrice || isGenerating ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: 'var(--brand-primary)', color: '#000', boxShadow: '0 10px 30px var(--brand-glow)' }}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Plan...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Plan</>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

// ─── Utility ──────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default AIWishTracker;
