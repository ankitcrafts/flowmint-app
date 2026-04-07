
import { supabase } from './supabase';

// ═══════════════════════════════════════════════════
// FlowMint Rewards Service
// ═══════════════════════════════════════════════════
// Manages the complete rewards ecosystem:
//   - Reward wallet (coins + cash balance)
//   - Earning coins via app activity
//   - P2P gifting & friend donations (cash)
//   - Transfer eligibility (₹1000 minimum)
//   - Daily challenges & streak tracking
//   - Referral system
// ═══════════════════════════════════════════════════

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error('Not authenticated');
  return session.user.id;
}

// ─── Types ──────────────────────────────────────────

export interface RewardWallet {
  id: string;
  user_id: string;
  flow_coins: number;
  cash_balance: number;
  lifetime_coins_earned: number;
  lifetime_cash_earned: number;
  lifetime_cash_withdrawn: number;
  current_streak: number;
  longest_streak: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  last_active_date: string | null;
  created_at: string;
}

export interface RewardTransaction {
  id: string;
  user_id: string;
  type: string;
  coins: number;
  cash: number;
  description: string;
  related_user_id?: string;
  reference_id?: string;
  metadata?: any;
  created_at: string;
}

export interface RewardChallenge {
  id: string;
  challenge_type: string;
  coins_reward: number;
  is_completed: boolean;
  completed_at?: string;
  expires_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: 'pending' | 'joined' | 'rewarded';
  bonus_coins: number;
  bonus_cash: number;
  created_at: string;
  joined_at?: string;
}

export interface RewardTransfer {
  id: string;
  sender_id: string;
  recipient_id?: string;
  recipient_upi?: string;
  recipient_name?: string;
  amount: number;
  type: 'bank_transfer' | 'friend_share' | 'donation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference_id?: string;
  notes?: string;
  created_at: string;
}

// ─── Tier Thresholds ────────────────────────────────

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
  diamond: 15000,
};

function calculateTier(lifetimeCoins: number): RewardWallet['tier'] {
  if (lifetimeCoins >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (lifetimeCoins >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimeCoins >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimeCoins >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// ─── Coin Reward Config ─────────────────────────────

export const COIN_REWARDS = {
  daily_login: 10,
  log_expense: 5,
  pay_bill: 15,
  save_goal: 20,
  invite_friend: 100,
  check_credit: 10,
  streak_7: 50,
  streak_30: 200,
  referral_bonus: 100,
  first_action: 25,
};

// ═══════════════════════════════════════════════════
// Wallet Service
// ═══════════════════════════════════════════════════

export const rewardService = {

  // ─── Get or Create Wallet ───────────────────────
  async getWallet(): Promise<RewardWallet> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('reward_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    // Auto-create wallet if missing
    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from('reward_wallets')
        .insert([{ user_id: userId }])
        .select()
        .single();
      if (createErr) throw createErr;
      return created as RewardWallet;
    }

    return data as RewardWallet;
  },

  // ─── Earn Coins (generic) ──────────────────────
  async earnCoins(
    type: RewardTransaction['type'],
    coins: number,
    description: string,
    metadata?: any
  ): Promise<{ wallet: RewardWallet; transaction: RewardTransaction }> {
    const userId = await getUserId();
    const wallet = await this.getWallet();

    const newCoins = wallet.flow_coins + coins;
    const newLifetime = wallet.lifetime_coins_earned + coins;
    const newTier = calculateTier(newLifetime);

    // Update wallet
    const { data: updatedWallet, error: walletErr } = await supabase
      .from('reward_wallets')
      .update({
        flow_coins: newCoins,
        lifetime_coins_earned: newLifetime,
        tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (walletErr) throw walletErr;

    // Record transaction
    const { data: txn, error: txnErr } = await supabase
      .from('reward_transactions')
      .insert([{
        user_id: userId,
        type,
        coins,
        cash: 0,
        description,
        metadata: metadata || {},
      }])
      .select()
      .single();

    if (txnErr) throw txnErr;

    return { wallet: updatedWallet as RewardWallet, transaction: txn as RewardTransaction };
  },

  // ─── Daily Login Reward ────────────────────────
  async claimDailyLogin(): Promise<{ wallet: RewardWallet; streakBonus: number } | null> {
    const userId = await getUserId();
    const wallet = await this.getWallet();
    const today = new Date().toISOString().split('T')[0];

    // Already claimed today
    if (wallet.last_active_date === today) return null;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const isConsecutive = wallet.last_active_date === yesterday;
    const newStreak = isConsecutive ? wallet.current_streak + 1 : 1;
    const longestStreak = Math.max(newStreak, wallet.longest_streak);

    let totalCoins = COIN_REWARDS.daily_login;
    let streakBonus = 0;

    // Streak bonuses
    if (newStreak === 7) {
      streakBonus = COIN_REWARDS.streak_7;
      totalCoins += streakBonus;
    } else if (newStreak === 30) {
      streakBonus = COIN_REWARDS.streak_30;
      totalCoins += streakBonus;
    } else if (newStreak > 0 && newStreak % 7 === 0) {
      streakBonus = COIN_REWARDS.streak_7;
      totalCoins += streakBonus;
    }

    const newLifetime = wallet.lifetime_coins_earned + totalCoins;

    const { data: updatedWallet, error: walletErr } = await supabase
      .from('reward_wallets')
      .update({
        flow_coins: wallet.flow_coins + totalCoins,
        lifetime_coins_earned: newLifetime,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        tier: calculateTier(newLifetime),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (walletErr) throw walletErr;

    // Log transaction
    await supabase.from('reward_transactions').insert([{
      user_id: userId,
      type: 'earn_daily_login',
      coins: totalCoins,
      cash: 0,
      description: `Daily login reward${streakBonus ? ` + ${newStreak}-day streak bonus!` : ''}`,
      metadata: { streak: newStreak, streak_bonus: streakBonus },
    }]);

    return { wallet: updatedWallet as RewardWallet, streakBonus };
  },

  // ─── Receive Cash Gift from Friend ─────────────
  async receiveCashGift(
    fromUserId: string,
    amount: number,
    fromName: string
  ): Promise<RewardWallet> {
    const userId = await getUserId();

    // Update receiver's wallet
    const wallet = await this.getWallet();
    const newCash = Number(wallet.cash_balance) + amount;

    const { data: updated, error } = await supabase
      .from('reward_wallets')
      .update({
        cash_balance: newCash,
        lifetime_cash_earned: Number(wallet.lifetime_cash_earned) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log transaction
    await supabase.from('reward_transactions').insert([{
      user_id: userId,
      type: 'donate_received',
      coins: 0,
      cash: amount,
      description: `Cash gift received from ${fromName}`,
      related_user_id: fromUserId,
    }]);

    return updated as RewardWallet;
  },

  // ─── Send Cash to Friend (requires ₹1000 min) ──
  async sendCashToFriend(
    recipientUpi: string,
    recipientName: string,
    amount: number,
    notes?: string
  ): Promise<RewardTransfer> {
    const userId = await getUserId();
    const wallet = await this.getWallet();

    if (Number(wallet.cash_balance) < 1000) {
      throw new Error('Minimum ₹1,000 cash balance required for transfers');
    }
    if (amount > Number(wallet.cash_balance)) {
      throw new Error('Insufficient cash balance');
    }
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Deduct from wallet
    const { error: walletErr } = await supabase
      .from('reward_wallets')
      .update({
        cash_balance: Number(wallet.cash_balance) - amount,
        lifetime_cash_withdrawn: Number(wallet.lifetime_cash_withdrawn) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (walletErr) throw walletErr;

    // Create transfer record
    const { data: transfer, error: txErr } = await supabase
      .from('reward_transfers')
      .insert([{
        sender_id: userId,
        recipient_upi: recipientUpi,
        recipient_name: recipientName,
        amount,
        type: 'friend_share',
        status: 'completed',
        notes,
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (txErr) throw txErr;

    // Log transaction
    await supabase.from('reward_transactions').insert([{
      user_id: userId,
      type: 'send_gift',
      coins: 0,
      cash: -amount,
      description: `Cash sent to ${recipientName}`,
      reference_id: transfer!.id,
    }]);

    return transfer as RewardTransfer;
  },

  // ─── Donate Cash to Friend (helps them reach ₹1000) ─
  async donateCash(
    recipientEmail: string,
    amount: number,
    message?: string
  ): Promise<{ transfer: RewardTransfer; referralCoins: number }> {
    const userId = await getUserId();
    const wallet = await this.getWallet();

    if (amount <= 0) throw new Error('Amount must be positive');
    if (amount > Number(wallet.cash_balance)) throw new Error('Insufficient cash balance');

    // Deduct from sender
    const { error: walletErr } = await supabase
      .from('reward_wallets')
      .update({
        cash_balance: Number(wallet.cash_balance) - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (walletErr) throw walletErr;

    // Create transfer record
    const { data: transfer, error: txErr } = await supabase
      .from('reward_transfers')
      .insert([{
        sender_id: userId,
        recipient_name: recipientEmail,
        amount,
        type: 'donation',
        status: 'completed',
        notes: message,
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (txErr) throw txErr;

    // Sender gets bonus coins for generosity
    const referralCoins = Math.min(Math.floor(amount / 10), 50);
    if (referralCoins > 0) {
      await this.earnCoins('earn_referral_bonus', referralCoins, `Bonus for donating ₹${amount}`);
    }

    // Log send transaction
    await supabase.from('reward_transactions').insert([{
      user_id: userId,
      type: 'donate_sent',
      coins: 0,
      cash: -amount,
      description: `Donated ₹${amount} to ${recipientEmail}`,
      reference_id: transfer!.id,
    }]);

    return { transfer: transfer as RewardTransfer, referralCoins };
  },

  // ─── Get Transaction History ───────────────────
  async getTransactionHistory(limit = 20): Promise<RewardTransaction[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as RewardTransaction[];
  },

  // ─── Get Transfer History ─────────────────────
  async getTransferHistory(limit = 10): Promise<RewardTransfer[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('reward_transfers')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as RewardTransfer[];
  },

  // ─── Get Daily Challenges ─────────────────────
  async getDailyChallenges(): Promise<RewardChallenge[]> {
    const userId = await getUserId();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('reward_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('expires_at', today);

    if (error) throw error;

    // Generate daily challenges if none exist for today
    if (!data || data.length === 0) {
      const challenges = [
        { challenge_type: 'daily_login', coins_reward: COIN_REWARDS.daily_login },
        { challenge_type: 'log_expense', coins_reward: COIN_REWARDS.log_expense },
        { challenge_type: 'pay_bill', coins_reward: COIN_REWARDS.pay_bill },
        { challenge_type: 'check_credit', coins_reward: COIN_REWARDS.check_credit },
        { challenge_type: 'invite_friend', coins_reward: COIN_REWARDS.invite_friend },
      ];

      const { data: created, error: createErr } = await supabase
        .from('reward_challenges')
        .insert(challenges.map(c => ({
          ...c,
          user_id: userId,
          expires_at: today,
          is_completed: false,
        })))
        .select();

      if (createErr) throw createErr;
      return (created || []) as RewardChallenge[];
    }

    return data as RewardChallenge[];
  },

  // ─── Complete Challenge ───────────────────────
  async completeChallenge(challengeType: string): Promise<{ coins: number } | null> {
    const userId = await getUserId();
    const today = new Date().toISOString().split('T')[0];

    // Find incomplete challenge
    const { data: challenge, error: findErr } = await supabase
      .from('reward_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_type', challengeType)
      .eq('expires_at', today)
      .eq('is_completed', false)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!challenge) return null; // Already completed or doesn't exist

    // Mark complete
    const { error: updateErr } = await supabase
      .from('reward_challenges')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', challenge.id);

    if (updateErr) throw updateErr;

    // Award coins
    await this.earnCoins(
      `earn_${challengeType}` as any,
      challenge.coins_reward,
      `Challenge completed: ${challengeType.replace(/_/g, ' ')}`
    );

    return { coins: challenge.coins_reward };
  },

  // ─── Generate Referral Code ───────────────────
  async getOrCreateReferralCode(): Promise<string> {
    const userId = await getUserId();

    // Check existing
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', userId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (existing?.referral_code) return existing.referral_code;

    // Generate unique code
    const code = `FLOW${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase.from('referrals').insert([{
      referrer_id: userId,
      referral_code: code,
      bonus_coins: COIN_REWARDS.referral_bonus,
    }]);

    if (error) throw error;
    return code;
  },

  // ─── Get Referral Stats ───────────────────────
  async getReferralStats(): Promise<{ total: number; joined: number; rewarded: number; code: string }> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);

    if (error) throw error;

    const referrals = data || [];
    const code = await this.getOrCreateReferralCode();

    return {
      total: referrals.length,
      joined: referrals.filter(r => r.status === 'joined' || r.status === 'rewarded').length,
      rewarded: referrals.filter(r => r.status === 'rewarded').length,
      code,
    };
  },

  // ─── Check Transfer Eligibility ───────────────
  canTransfer(wallet: RewardWallet): { eligible: boolean; message: string; remaining: number } {
    const cashBalance = Number(wallet.cash_balance);
    if (cashBalance >= 1000) {
      return {
        eligible: true,
        message: 'You can transfer your cash rewards!',
        remaining: 0,
      };
    }
    return {
      eligible: false,
      message: `₹${(1000 - cashBalance).toFixed(0)} more needed to unlock transfers`,
      remaining: 1000 - cashBalance,
    };
  },

  // ─── Tier Info ────────────────────────────────
  getTierInfo(tier: RewardWallet['tier']): { name: string; color: string; nextTier: string | null; coinsToNext: number; icon: string } {
    const tiers = [
      { name: 'Bronze', color: '#CD7F32', icon: '🥉', min: 0 },
      { name: 'Silver', color: '#C0C0C0', icon: '🥈', min: 500 },
      { name: 'Gold', color: '#FFD700', icon: '🥇', min: 2000 },
      { name: 'Platinum', color: '#E5E4E2', icon: '💎', min: 5000 },
      { name: 'Diamond', color: '#B9F2FF', icon: '👑', min: 15000 },
    ];

    const currentIdx = tiers.findIndex(t => t.name.toLowerCase() === tier);
    const current = tiers[currentIdx] || tiers[0];
    const next = tiers[currentIdx + 1];

    return {
      name: current.name,
      color: current.color,
      nextTier: next?.name || null,
      coinsToNext: next ? next.min - current.min : 0,
      icon: current.icon,
    };
  },
};
