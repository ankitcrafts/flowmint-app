import { useState, useEffect, useRef, type FC } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Gift, Star, Trophy, Flame, Users, ArrowUpRight, ArrowDownLeft,
  Copy, Check, ChevronRight, Coins, Sparkles, Target, Zap,
  CreditCard, Receipt, Shield, Crown, Share2, Heart, Clock,
  TrendingUp, Lock, Send, Wallet, X, AlertTriangle,
  CheckCircle2, PartyPopper, Gem
} from 'lucide-react';
import { rewardService, COIN_REWARDS, type RewardWallet, type RewardTransaction, type RewardChallenge } from '../services/rewardService';

// ─── Animation Variants ─────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 }
  }
};

const cardSlideUp = {
  hidden: { opacity: 0, y: 35, scale: 0.96 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 }
  }
};

const cardBounce = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 18, mass: 0.8 }
  }
};

const listItemSlide = {
  hidden: { opacity: 0, x: -25 },
  show: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: 'spring' as const, stiffness: 300, damping: 25 }
  })
};

// ─── Tier Colors & Config ───────────────────────
const TIER_CONFIG: Record<string, { gradient: string; glow: string; text: string; icon: string; badge: string }> = {
  bronze: {
    gradient: 'linear-gradient(135deg, #CD7F32, #A0522D)',
    glow: 'rgba(205, 127, 50, 0.3)',
    text: '#CD7F32',
    icon: '🥉',
    badge: 'BRONZE'
  },
  silver: {
    gradient: 'linear-gradient(135deg, #9CA3AF, #6B7280)',
    glow: 'rgba(156, 163, 175, 0.3)',
    text: '#6B7280',
    icon: '🥈',
    badge: 'SILVER'
  },
  gold: {
    gradient: 'linear-gradient(135deg, #FFC107, #E6AC00)',
    glow: 'rgba(255, 193, 7, 0.3)',
    text: '#E6AC00',
    icon: '🥇',
    badge: 'GOLD'
  },
  platinum: {
    gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    glow: 'rgba(99, 102, 241, 0.3)',
    text: '#6366F1',
    icon: '💎',
    badge: 'PLATINUM'
  },
  diamond: {
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    glow: 'rgba(59, 130, 246, 0.3)',
    text: '#3B82F6',
    icon: '👑',
    badge: 'DIAMOND'
  },
};

// ─── Challenge Labels & Icons ───────────────────
const CHALLENGE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  daily_login: { label: 'Daily Login', icon: <Flame className="w-4 h-4" />, color: '#F59E0B' },
  log_expense: { label: 'Log an Expense', icon: <Receipt className="w-4 h-4" />, color: '#EF4444' },
  pay_bill: { label: 'Pay a Bill', icon: <CreditCard className="w-4 h-4" />, color: '#3B82F6' },
  check_credit: { label: 'Check Credit Score', icon: <Shield className="w-4 h-4" />, color: '#22C55E' },
  invite_friend: { label: 'Invite a Friend', icon: <Users className="w-4 h-4" />, color: '#8B5CF6' },
  save_goal: { label: 'Save Towards Goal', icon: <Target className="w-4 h-4" />, color: '#EC4899' },
  streak_7: { label: '7-Day Streak', icon: <Flame className="w-4 h-4" />, color: '#EF4444' },
  streak_30: { label: '30-Day Streak', icon: <Crown className="w-4 h-4" />, color: '#E6AC00' },
};

// ─── Tab Type ───────────────────────────────────
type RewardTab = 'overview' | 'earn' | 'transfer' | 'history';

const Rewards: FC = () => {
  const [activeTab, setActiveTab] = useState<RewardTab>('overview');
  const [wallet, setWallet] = useState<RewardWallet | null>(null);
  const [challenges, setChallenges] = useState<RewardChallenge[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardCoins, setDailyRewardCoins] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);

  // Transfer form
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'friend_share' | 'donation'>('friend_share');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletData, challengeData, txnData, refCode] = await Promise.all([
        rewardService.getWallet(),
        rewardService.getDailyChallenges(),
        rewardService.getTransactionHistory(15),
        rewardService.getOrCreateReferralCode(),
      ]);
      setWallet(walletData);
      setChallenges(challengeData);
      setTransactions(txnData);
      setReferralCode(refCode);

      // Auto-claim daily login
      const dailyResult = await rewardService.claimDailyLogin();
      if (dailyResult) {
        setWallet(dailyResult.wallet);
        setDailyRewardCoins(COIN_REWARDS.daily_login);
        setStreakBonus(dailyResult.streakBonus);
        setShowDailyReward(true);
        setTimeout(() => setShowDailyReward(false), 4000);
      }
    } catch (err) {
      console.error('Rewards load error:', err);
    }
    setLoading(false);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = async () => {
    if (!wallet) return;
    setTransferLoading(true);
    setTransferError('');
    try {
      const amount = parseFloat(transferAmount);
      if (transferType === 'friend_share') {
        await rewardService.sendCashToFriend(transferRecipient, transferRecipient, amount, transferNotes);
      } else {
        await rewardService.donateCash(transferRecipient, amount, transferNotes);
      }
      setTransferSuccess(true);
      setWallet(await rewardService.getWallet());
      setTransactions(await rewardService.getTransactionHistory(15));
      setTimeout(() => {
        setTransferSuccess(false);
        setShowTransferModal(false);
        setTransferRecipient('');
        setTransferAmount('');
        setTransferNotes('');
      }, 2500);
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    }
    setTransferLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse pb-24">
        <div className="h-56 glass rounded-[2.5rem]" style={{ backgroundColor: 'var(--card-subtle)' }} />
        <div className="h-16 glass rounded-2xl" style={{ backgroundColor: 'var(--card-subtle)' }} />
        <div className="h-48 glass rounded-[2rem]" style={{ backgroundColor: 'var(--card-subtle)' }} />
        <div className="h-48 glass rounded-[2rem]" style={{ backgroundColor: 'var(--card-subtle)' }} />
      </div>
    );
  }

  if (!wallet) return null;

  const tierConfig = TIER_CONFIG[wallet.tier] || TIER_CONFIG.bronze;
  const transferEligibility = rewardService.canTransfer(wallet);
  const tierInfo = rewardService.getTierInfo(wallet.tier);
  const completedChallenges = challenges.filter(c => c.is_completed).length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-24 space-y-5"
    >
      {/* ═══ Daily Reward Toast ═══ */}
      <AnimatePresence>
        {showDailyReward && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            className="fixed top-20 left-4 right-4 max-w-md mx-auto z-[100] glass rounded-3xl p-5 border-2 shadow-2xl"
            style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--card-bg, rgba(10,10,10,0.95))' }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
                className="text-3xl"
              >
                🎉
              </motion.div>
              <div className="flex-1">
                <p className="font-black text-brand text-sm">Daily Reward Claimed!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-color)', opacity: 0.7 }}>
                  +{dailyRewardCoins} Flow Coins{streakBonus > 0 ? ` + ${streakBonus} streak bonus!` : ''}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-2xl font-black text-brand"
              >
                +{dailyRewardCoins + streakBonus}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Hero Wallet Card ═══ */}
      <motion.section
        variants={cardSlideUp}
        className="relative overflow-hidden rounded-[2.5rem] border"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(ellipse at 30% 20%, ${tierConfig.glow} 0%, transparent 50%),
                                radial-gradient(ellipse at 70% 80%, var(--brand-glow) 0%, transparent 50%)`,
              backgroundSize: '200% 200%',
            }}
          />
          {/* Floating coins */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-brand/10 pointer-events-none"
              initial={{ x: Math.random() * 300, y: Math.random() * 200, opacity: 0.05 }}
              animate={{
                y: [Math.random() * 200, Math.random() * -50, Math.random() * 200],
                rotate: [0, 360],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            >
              <Coins className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        <div className="relative glass p-6" style={{ backgroundColor: 'transparent' }}>
          {/* Tier Badge */}
          <div className="flex items-center justify-between mb-6">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: tierConfig.gradient, boxShadow: `0 4px 15px ${tierConfig.glow}` }}
              animate={{ boxShadow: [`0 4px 15px ${tierConfig.glow}`, `0 4px 25px ${tierConfig.glow}`, `0 4px 15px ${tierConfig.glow}`] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-sm">{tierConfig.icon}</span>
              {tierConfig.badge} MEMBER
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[10px] font-black text-orange-400">{wallet.current_streak} day streak</span>
              </motion.div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Flow Coins */}
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Flow Coins</p>
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-4xl font-black tracking-tighter text-brand"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {wallet.flow_coins.toLocaleString()}
                </motion.span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400">+{COIN_REWARDS.daily_login}/day</span>
              </div>
            </div>

            {/* Cash Rewards */}
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Cash Rewards</p>
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-4xl font-black tracking-tighter"
                  style={{ color: Number(wallet.cash_balance) >= 1000 ? '#10B981' : 'var(--text-color)' }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  ₹{Number(wallet.cash_balance).toLocaleString()}
                </motion.span>
              </div>
              {!transferEligibility.eligible ? (
                <div className="flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3 text-yellow-400" />
                  <span className="text-[9px] font-bold text-yellow-400">₹{transferEligibility.remaining} to unlock</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400">Transfer ready!</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress to ₹1000 */}
          {!transferEligibility.eligible && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Progress to ₹1,000</span>
                <span className="text-[9px] font-black text-brand">
                  {Math.round((Number(wallet.cash_balance) / 1000) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (Number(wallet.cash_balance) / 1000) * 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  style={{
                    background: 'linear-gradient(90deg, var(--brand-primary), #06b6d4)',
                    boxShadow: '0 0 12px var(--brand-glow)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('earn')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
            >
              <Sparkles className="w-5 h-5 text-brand" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Earn More</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('transfer')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
            >
              <Send className="w-5 h-5 text-cyan-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Transfer</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('history')}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
            >
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">History</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* ═══ Tab Navigation ═══ */}
      <motion.div variants={cardSlideUp} className="flex p-1.5 rounded-2xl gap-1" style={{ backgroundColor: 'var(--card-subtle)' }}>
        {(['overview', 'earn', 'transfer', 'history'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab
                ? 'bg-brand text-black shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            style={activeTab === tab ? { boxShadow: '0 4px 12px var(--brand-glow)' } : {}}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* ═══ Tab Content ═══ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                {/* Daily Challenges */}
                <motion.section variants={cardSlideUp} className="glass rounded-[2rem] p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                      >
                        <Target className="w-5 h-5 text-brand" />
                      </motion.div>
                      <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Daily Challenges</h3>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--brand-glow)', color: 'var(--brand-primary)' }}>
                      {completedChallenges}/{challenges.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {challenges.map((challenge) => {
                      const meta = CHALLENGE_META[challenge.challenge_type] || CHALLENGE_META.daily_login;
                      return (
                        <motion.div
                          key={challenge.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            challenge.is_completed ? 'opacity-60' : ''
                          }`}
                          style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                          whileHover={!challenge.is_completed ? { scale: 1.01, x: 3 } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${meta.color}15` }}
                            >
                              <div style={{ color: meta.color }}>{meta.icon}</div>
                            </div>
                            <div>
                              <p className="text-xs font-bold" style={{ color: 'var(--text-color)' }}>{meta.label}</p>
                              <p className="text-[9px] font-bold text-gray-500">+{challenge.coins_reward} coins</p>
                            </div>
                          </div>
                          {challenge.is_completed ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                            </motion.div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--glass-border)' }}>
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              </div>

              <div className="lg:col-span-1 space-y-6">
                {/* Referral Card */}
                <motion.section
                  variants={cardSlideUp}
                  className="glass rounded-[2rem] p-5 border relative overflow-hidden"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <motion.div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    style={{ backgroundColor: '#8B5CF6' }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-purple-400" />
                      <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Invite & Earn Together</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Invite friends to FlowMint! Both of you earn <span className="text-brand font-black">{COIN_REWARDS.referral_bonus} coins</span>.
                      Friends can donate cash to help you reach ₹1,000 faster!
                    </p>

                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border font-mono text-sm font-bold tracking-wider"
                        style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)', color: 'var(--text-color)' }}
                      >
                        <Gift className="w-4 h-4 text-brand shrink-0" />
                        {referralCode}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCopyCode}
                        className="p-3 rounded-2xl bg-brand text-black font-black"
                        style={{ boxShadow: '0 4px 12px var(--brand-glow)' }}
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 rounded-2xl border"
                        style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                      >
                        <Share2 className="w-5 h-5 text-purple-400" />
                      </motion.button>
                    </div>
                  </div>
                </motion.section>

                {/* Tier Progress */}
                <motion.section
                  variants={cardSlideUp}
                  className="glass rounded-[2rem] p-5 border"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5" style={{ color: tierConfig.text }} />
                    <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Tier Progress</h3>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: tierConfig.gradient, boxShadow: `0 6px 20px ${tierConfig.glow}` }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    >
                      {tierConfig.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-black text-lg" style={{ color: tierConfig.text }}>{tierInfo.name}</h4>
                      {tierInfo.nextTier && (
                        <>
                          <p className="text-[10px] font-bold text-gray-500">
                            {tierInfo.coinsToNext - (wallet.lifetime_coins_earned % tierInfo.coinsToNext)} coins to {tierInfo.nextTier}
                          </p>
                          <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (wallet.lifetime_coins_earned % tierInfo.coinsToNext / tierInfo.coinsToNext) * 100)}%` }}
                              transition={{ duration: 1.2, delay: 0.8 }}
                              style={{ background: tierConfig.gradient }}
                            />
                          </div>
                        </>
                      )}
                      {!tierInfo.nextTier && (
                        <p className="text-[10px] font-bold text-brand">Maximum tier reached! 🎉</p>
                      )}
                    </div>
                  </div>

                  {/* Lifetime Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      { label: 'Earned', value: wallet.lifetime_coins_earned.toLocaleString(), icon: <Coins className="w-3 h-3 text-brand" />, color: 'text-brand' },
                      { label: 'Longest Streak', value: `${wallet.longest_streak}d`, icon: <Flame className="w-3 h-3 text-orange-400" />, color: 'text-orange-400' },
                      { label: 'Cash Earned', value: `₹${Number(wallet.lifetime_cash_earned).toLocaleString()}`, icon: <Wallet className="w-3 h-3 text-emerald-400" />, color: 'text-emerald-400' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-2.5 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                        <div className="flex items-center justify-center gap-1 mb-1">{stat.icon}</div>
                        <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-[7px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              </div>
            </div>
          )}

          {activeTab === 'earn' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* How to Earn Coins */}
              <motion.section variants={cardSlideUp} className="glass rounded-[2rem] p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Ways to Earn</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: <Flame className="w-5 h-5" />, title: 'Daily Login', coins: COIN_REWARDS.daily_login, desc: 'Open the app every day', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
                    { icon: <Receipt className="w-5 h-5" />, title: 'Log Expenses', coins: COIN_REWARDS.log_expense, desc: 'Track your spending', color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
                    { icon: <CreditCard className="w-5 h-5" />, title: 'Pay Bills', coins: COIN_REWARDS.pay_bill, desc: 'Pay bills on time', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
                    { icon: <Target className="w-5 h-5" />, title: 'Complete Goals', coins: COIN_REWARDS.save_goal, desc: 'Save towards your goals', color: '#EC4899', bg: 'rgba(236,72,153,0.10)' },
                    { icon: <Users className="w-5 h-5" />, title: 'Invite Friends', coins: COIN_REWARDS.invite_friend, desc: 'Refer & earn together', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
                    { icon: <Shield className="w-5 h-5" />, title: 'Check Credit', coins: COIN_REWARDS.check_credit, desc: 'Monitor your credit score', color: '#22C55E', bg: 'rgba(34,197,94,0.10)' },
                    { icon: <Flame className="w-5 h-5" />, title: '7-Day Streak', coins: COIN_REWARDS.streak_7, desc: 'Login 7 days in a row', color: '#EF4444', bg: 'rgba(239,68,68,0.10)' },
                    { icon: <Crown className="w-5 h-5" />, title: '30-Day Streak', coins: COIN_REWARDS.streak_30, desc: 'Login 30 days in a row', color: '#E6AC00', bg: 'rgba(230,172,0,0.10)' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between p-3.5 rounded-2xl border"
                      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                      initial={{ opacity: 0, x: -25 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                      whileHover={{ x: 4, scale: 1.01, borderColor: item.color + '40' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                          <div style={{ color: item.color }}>{item.icon}</div>
                        </div>
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-color)' }}>{item.title}</p>
                          <p className="text-[9px] text-gray-500 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--brand-glow)' }}>
                        <Coins className="w-3 h-3 text-brand" />
                        <span className="text-[10px] font-black text-brand">+{item.coins}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* Earn Cash via Friends */}
              <motion.section
                variants={cardSlideUp}
                className="glass rounded-[2rem] p-5 border relative overflow-hidden"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <motion.div
                  className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                  animate={{ opacity: [0.08, 0.15, 0.08] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  style={{ backgroundColor: '#10B981' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Earn Cash via Friends</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Friends can <span className="text-emerald-400 font-bold">donate cash</span> to your reward wallet!
                    Once you reach <span className="text-brand font-black">₹1,000</span>, you can transfer money to bank accounts
                    or share with other friends.
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="flex -space-x-2">
                      {['🧑', '👩', '🧒'].map((emoji, i) => (
                        <motion.div
                          key={i}
                          className="w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm"
                          style={{ borderColor: 'var(--bg-color, #0a0a0a)', backgroundColor: 'var(--card-subtle)' }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                        >
                          {emoji}
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-400">Friend Donations</p>
                      <p className="text-[9px] text-gray-500">Each friend's ₹ donation helps you reach ₹1,000</p>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Transfer Section */}
              <motion.section variants={cardSlideUp} className="glass rounded-[2rem] p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Cash Transfers</h3>
                </div>

                {!transferEligibility.eligible ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
                    >
                      <Lock className="w-10 h-10 text-yellow-400" />
                    </motion.div>
                    <h4 className="font-black text-lg mb-2" style={{ color: 'var(--text-color)' }}>Transfers Locked</h4>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed max-w-xs mx-auto">
                      You need a minimum of <span className="text-brand font-black">₹1,000</span> cash rewards
                      to transfer. Earn more via friend donations and sharing!
                    </p>
                    <div className="max-w-xs mx-auto">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-gray-500">₹{Number(wallet.cash_balance)} / ₹1,000</span>
                        <span className="text-[9px] font-black text-brand">
                          {Math.round((Number(wallet.cash_balance) / 1000) * 100)}%
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(Number(wallet.cash_balance) / 1000) * 100}%` }}
                          transition={{ duration: 1.5, delay: 0.3 }}
                          style={{ background: 'linear-gradient(90deg, var(--brand-primary), #06b6d4)' }}
                        />
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('earn')}
                      className="mt-6 px-6 py-3 bg-brand text-black rounded-2xl font-black text-xs uppercase tracking-widest"
                      style={{ boxShadow: '0 4px 12px var(--brand-glow)' }}
                    >
                      Learn How to Earn
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 mb-2">You have ₹{Number(wallet.cash_balance).toLocaleString()} available to transfer.</p>

                    <motion.button
                      whileHover={{ scale: 1.02, x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setTransferType('friend_share'); setShowTransferModal(true); }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all"
                      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}>
                          <Send className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>Send to Friend</p>
                          <p className="text-[9px] text-gray-500">Transfer cash via UPI</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setTransferType('donation'); setShowTransferModal(true); }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all"
                      style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                          <Heart className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>Donate to Friend</p>
                          <p className="text-[9px] text-gray-500">Help a friend reach ₹1,000</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>
                )}
              </motion.section>

              {/* Transfer Rules */}
              <motion.section variants={cardSlideUp} className="glass rounded-[2rem] p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <h3 className="font-black text-xs tracking-tight" style={{ color: 'var(--text-color)' }}>Transfer Rules</h3>
                </div>
                <div className="space-y-2">
                  {[
                    'Minimum ₹1,000 cash balance required for transfers',
                    'Cash rewards are earned via friend donations & sharing',
                    'Transfers are processed instantly via UPI',
                    'All transactions are securely recorded',
                    'Donors earn bonus Flow Coins for generosity',
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[10px] mt-0.5 text-brand">●</span>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>
          )}

          {activeTab === 'history' && (
            <motion.section variants={cardSlideUp} className="glass rounded-[2rem] p-5 border" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>Reward History</h3>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--card-subtle)' }}
                  >
                    <Sparkles className="w-7 h-7 text-gray-500" />
                  </motion.div>
                  <p className="text-xs text-gray-500 font-bold">No reward activity yet</p>
                  <p className="text-[10px] text-gray-600 mt-1">Start earning coins by completing daily challenges!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((txn, i) => {
                    const isEarn = txn.coins > 0 || txn.cash > 0;
                    return (
                      <motion.div
                        key={txn.id}
                        className="flex items-center justify-between p-3 rounded-2xl border"
                        style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: isEarn ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}
                          >
                            {isEarn ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold truncate max-w-[180px]" style={{ color: 'var(--text-color)' }}>
                              {txn.description}
                            </p>
                            <p className="text-[9px] text-gray-500">
                              {new Date(txn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {txn.coins !== 0 && (
                            <p className={`text-xs font-black ${txn.coins > 0 ? 'text-brand' : 'text-red-400'}`}>
                              {txn.coins > 0 ? '+' : ''}{txn.coins} coins
                            </p>
                          )}
                          {txn.cash !== 0 && (
                            <p className={`text-xs font-black ${txn.cash > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {txn.cash > 0 ? '+' : ''}₹{Math.abs(Number(txn.cash))}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ═══ Transfer Modal ═══ */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => !transferLoading && setShowTransferModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-[2.5rem] p-6 pb-10"
              style={{ backgroundColor: 'var(--bg-color, #0a0a0a)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--glass-border)' }} />

              {transferSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h3 className="font-black text-xl mb-2" style={{ color: 'var(--text-color)' }}>Transfer Successful! 🎉</h3>
                  <p className="text-sm text-gray-400">₹{transferAmount} sent to {transferRecipient}</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>
                      {transferType === 'friend_share' ? 'Send Cash' : 'Donate to Friend'}
                    </h3>
                    <button onClick={() => setShowTransferModal(false)} className="p-2 rounded-full" style={{ backgroundColor: 'var(--card-subtle)' }}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                        {transferType === 'friend_share' ? 'Recipient UPI / Phone' : 'Friend\'s Email'}
                      </label>
                      <input
                        type="text"
                        value={transferRecipient}
                        onChange={(e) => setTransferRecipient(e.target.value)}
                        placeholder={transferType === 'friend_share' ? 'name@upi' : 'friend@email.com'}
                        className="w-full px-4 py-3 rounded-2xl border text-sm font-medium"
                        style={{
                          borderColor: 'var(--glass-border)',
                          backgroundColor: 'var(--card-subtle)',
                          color: 'var(--text-color)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="500"
                        className="w-full px-4 py-3 rounded-2xl border text-sm font-medium"
                        style={{
                          borderColor: 'var(--glass-border)',
                          backgroundColor: 'var(--card-subtle)',
                          color: 'var(--text-color)',
                        }}
                      />
                      <p className="text-[9px] font-bold text-gray-500 mt-1">
                        Available: ₹{Number(wallet.cash_balance).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        value={transferNotes}
                        onChange={(e) => setTransferNotes(e.target.value)}
                        placeholder="Thanks for being awesome! 🎉"
                        className="w-full px-4 py-3 rounded-2xl border text-sm font-medium"
                        style={{
                          borderColor: 'var(--glass-border)',
                          backgroundColor: 'var(--card-subtle)',
                          color: 'var(--text-color)',
                        }}
                      />
                    </div>

                    {transferError && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-xs text-red-400 font-medium">{transferError}</p>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleTransfer}
                      disabled={transferLoading || !transferRecipient || !transferAmount}
                      className="w-full py-4 rounded-2xl bg-brand text-black font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ boxShadow: '0 4px 20px var(--brand-glow)' }}
                    >
                      {transferLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Zap className="w-4 h-4" />
                          </motion.div>
                          Processing...
                        </div>
                      ) : (
                        `${transferType === 'friend_share' ? 'Send' : 'Donate'} ₹${transferAmount || '0'}`
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Rewards;
