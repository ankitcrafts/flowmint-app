import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, TrendingUp, AlertCircle, HandCoins, ExternalLink, ShieldAlert, CheckCircle2, Activity, Wallet } from 'lucide-react';
import { supabase } from '../services/supabase';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  dob?: string;
  isMinor?: boolean;
  guardianId?: string;
}

interface LoanRequest {
  id: string;
  borrowerName: string;
  amount: number;
  purpose: string;
  tenure: number;
  interest: number;
  riskScore: 'A' | 'B' | 'C';
}

const MOCK_REQUESTS: LoanRequest[] = [
  { id: '11111111-1111-1111-1111-111111111111', borrowerName: 'Rahul V.', amount: 5000, purpose: 'Freelance Equipment', tenure: 3, interest: 12, riskScore: 'A' },
  { id: '22222222-2222-2222-2222-222222222222', borrowerName: 'Sneha P.', amount: 12000, purpose: 'College Course', tenure: 6, interest: 14, riskScore: 'B' },
  { id: '33333333-3333-3333-3333-333333333333', borrowerName: 'Aman K.', amount: 3000, purpose: 'Medical Emergency', tenure: 2, interest: 10, riskScore: 'A' },
  { id: '44444444-4444-4444-4444-444444444444', borrowerName: 'Vikram S.', amount: 20000, purpose: 'Personal', tenure: 12, interest: 16, riskScore: 'C' },
];

export default function P2PMarketplace({ userProfile }: { userProfile: UserProfile | null }) {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [fundedId, setFundedId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'invest' | 'borrow'>('invest');
  const [borrowAmount, setBorrowAmount] = useState(userProfile?.isMinor ? 500 : 5000);
  const [borrowTenure, setBorrowTenure] = useState(3);
  const [reputationScore, setReputationScore] = useState(userProfile?.isMinor ? 300 : 650);
  const [myActiveLoan, setMyActiveLoan] = useState<{id: string, amount: number, remaining: number} | null>({
     id: 'mock-my-loan',
     amount: userProfile?.isMinor ? 1000 : 10000,
     remaining: userProfile?.isMinor ? 1000 : 10000
  });

  const isMinor = userProfile?.isMinor || false;
  // Minors can only fund up to a limited amount (simulated logic)
  const minorFundingLimit = 1000; 
  const maxBorrowLimit = isMinor ? 2000 : 50000;

  const handleFund = async (id: string, amount: number) => {
    if (isMinor && amount > minorFundingLimit) {
       alert(`Restricted: Guardian policy limits your max funding per loan to ₹${minorFundingLimit}`);
       return;
    }
    
    setFundedId(id);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
       // Validate if mock loan exists, if not create to satisfy Foreign Key
       const { data: mockLoan } = await supabase.from('p2p_loans').select('id').eq('id', id).maybeSingle();
       if (!mockLoan) {
           await supabase.from('p2p_loans').insert({
              id: id,
              borrower_id: session.user.id,
              amount: amount,
              interest_rate: 12.5,
              duration_months: 6,
              status: 'funding'
           });
       }

       await supabase.from('p2p_investments').insert({
         loan_id: id,
         lender_id: session.user.id,
         amount_invested: amount,
         status: 'active'
       });
    }

    setTimeout(() => {
      setRequests(reqs => reqs.filter(r => r.id !== id));
      setFundedId(null);
    }, 1500);
  };

  const getRiskColor = (score: string) => {
    if (score === 'A') return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
    if (score === 'B') return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
    return 'text-red-400 border-red-400/20 bg-red-400/10';
  };

  const handleRepay = () => {
    if (myActiveLoan) {
      const emi = Math.min(myActiveLoan.remaining, isMinor ? 250 : 2500);
      setMyActiveLoan(prev => prev ? { ...prev, remaining: prev.remaining - emi } : null);
      setReputationScore(prev => Math.min(900, prev + 15));
    }
  };

  const handleCreateLoan = async () => {
     if (borrowAmount > maxBorrowLimit) return;
     const { data: { session } } = await supabase.auth.getSession();
     if (session) {
        const { data: newLoan } = await supabase.from('p2p_loans').insert({
           borrower_id: session.user.id,
           amount: borrowAmount,
           interest_rate: 10.5,
           duration_months: borrowTenure,
           status: 'pending_approval'
        }).select('id').maybeSingle();

        if (isMinor && newLoan) {
            await supabase.from('agreements').insert({
               user_id: session.user.id,
               type: 'Lending Contract',
               reference_id: newLoan.id
            });
        }
     }
     
     alert("Loan request pushed to the community marketplace! Pending funding.");
     setActiveTab('invest');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Community Lend</h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">P2P Lending Module v1.0</p>
      </div>

      <div className="flex bg-white/5 rounded-xl p-1 mb-6">
        <button 
          onClick={() => setActiveTab('invest')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'invest' ? 'bg-brand text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Invest
        </button>
        <button 
          onClick={() => setActiveTab('borrow')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'borrow' ? 'bg-brand text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Borrow
        </button>
      </div>

      {activeTab === 'invest' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          {isMinor && (
            <div className="glass border border-brand/30 rounded-[1.5rem] p-5 shadow-[0_0_20px_var(--brand-glow)]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center shrink-0 text-brand">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight" style={{ color: 'var(--text-color)' }}>Guardian Restricted Mode</h4>
                  <p className="text-[10px] mt-1 text-gray-400 font-bold leading-tight">
                    Your account is subject to minor restrictions. Your maximum lending amount is strictly capped.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">Limit: ₹{minorFundingLimit}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> Avg Returns</p>
              <h4 className="text-xl font-black mt-1 text-emerald-400">12.5%</h4>
            </div>
            <div className="glass rounded-[1.5rem] p-4 border text-center theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1"><HandCoins className="w-3 h-3 text-brand" /> Total Deployed</p>
              <h4 className="text-xl font-black mt-1" style={{ color: 'var(--text-color)' }}>₹0</h4>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg tracking-tight" style={{ color: 'var(--text-color)' }}>Active Requests</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Swipe to fund</span>
            </div>

            <AnimatePresence>
              {requests.map(req => (
                <motion.div
                  layout
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: 200 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100) {
                      handleFund(req.id, req.amount);
                    }
                  }}
                  whileDrag={{ scale: 1.05, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                  className={`relative glass border rounded-[2rem] p-6 theme-transition overflow-hidden cursor-grab active:cursor-grabbing ${fundedId === req.id ? 'bg-brand/20 border-brand' : ''}`}
                  style={{ borderColor: fundedId === req.id ? 'var(--brand-primary)' : 'var(--glass-border)' }}
                >
                  {fundedId === req.id ? (
                    <div className="absolute inset-0 flex flex-col justify-center items-center backdrop-blur-sm z-10 animate-in fade-in">
                      <CheckCircle2 className="w-12 h-12 text-brand animate-bounce" />
                      <span className="mt-2 font-black uppercase tracking-widest text-xs text-brand">Funded Successfully</span>
                    </div>
                  ) : null}

                  <div className="absolute top-0 right-0 bg-white/5 rounded-bl-[2rem] px-5 py-2 border-b border-l border-white/5 flex flex-col items-center">
                     <span className={`text-[12px] font-black ${getRiskColor(req.riskScore).split(' ')[0]}`}>{req.riskScore}</span>
                     <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest">Risk Class</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>₹{req.amount.toLocaleString()}</h4>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">For {req.purpose}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                        <span className="text-brand font-black text-xs">{req.borrowerName.charAt(0)}</span>
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{req.borrowerName}</span>
                    </div>

                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tenure</p>
                        <p className="font-black text-sm" style={{ color: 'var(--text-color)' }}>{req.tenure} mo</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Yield</p>
                        <p className="font-black text-sm text-brand">{req.interest}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--glass-border)' }}>
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                       <ExternalLink className="w-3 h-3" /> Drag right to fund
                     </p>
                     <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {requests.length === 0 && (
              <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>No active requests</h4>
                <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest">Check back later for more opportunities</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'borrow' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
           {/* Reputation Score Card */}
           <div className="glass p-6 rounded-[2rem] border theme-transition relative overflow-hidden" style={{ borderColor: 'var(--glass-border)' }}>
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
               <ShieldCheck className="w-32 h-32 text-brand" />
             </div>
             <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-brand" /> Reputation Score</span>
                <span className="text-xs font-black px-2 py-1 rounded bg-brand/10 text-brand uppercase">{isMinor ? 'Lvl 1 Pioneer' : 'Good Standing'}</span>
             </div>
             <div className="flex items-end gap-2 relative z-10">
                <h3 className="text-5xl font-black text-brand tracking-tighter">{reputationScore}</h3>
                <span className="text-sm font-bold text-gray-500 mb-1.5">/ 900</span>
             </div>
             <div className="w-full bg-white/5 h-2 rounded-full mt-5 overflow-hidden relative z-10">
                <div className="h-full bg-brand rounded-full transition-all duration-1000 shadow-[0_0_10px_var(--brand-glow)]" style={{ width: `${(reputationScore / 900) * 100}%` }} />
             </div>
             <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-4 text-center">Repay EMIs on time to boost your score & unlock higher limits</p>
           </div>

           {/* Borrow Request Form */}
           <div className="glass p-6 rounded-[2rem] border theme-transition space-y-6" style={{ borderColor: 'var(--glass-border)' }}>
              <div>
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount Needed</span>
                   <span className="text-xl font-black" style={{ color: 'var(--text-color)' }}>₹{borrowAmount.toLocaleString()}</span>
                 </div>
                 <input 
                   type="range" min="500" max={isMinor ? 5000 : 100000} step="500"
                   value={borrowAmount}
                   onChange={(e) => setBorrowAmount(Number(e.target.value))}
                   className="w-full accent-brand cursor-pointer"
                 />
                 <div className="flex justify-between items-center mt-2">
                   <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Min: ₹500</span>
                   <span className="text-[8px] font-black text-brand uppercase tracking-widest">Max: ₹{maxBorrowLimit.toLocaleString()}</span>
                 </div>
              </div>

              {isMinor && borrowAmount > maxBorrowLimit && (
                 <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <p className="text-[10px] font-bold leading-tight">
                       Exceeds your Guardian-approved 25% limit. Ask your Guardian to increase your allowance to request this amount.
                    </p>
                 </div>
              )}

              <button 
                disabled={borrowAmount > maxBorrowLimit}
                onClick={handleCreateLoan}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${borrowAmount > maxBorrowLimit ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-brand text-black hover:scale-[1.02] shadow-[0_10px_20px_var(--brand-glow)]'}`}
              >
                REQUEST FUNDS TO COMMUNITY
              </button>
           </div>

           {/* Active Borrowing & Repayment */}
           {myActiveLoan && myActiveLoan.remaining > 0 && (
             <div className="glass p-6 rounded-[2rem] border border-brand/30 theme-transition relative overflow-hidden" style={{ boxShadow: '0 0 20px var(--brand-glow)' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Wallet className="w-24 h-24 text-brand rotate-12" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                   Active Loan
                </h3>
                <div className="flex justify-between items-center mb-6 relative z-10">
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Remaining Balance</p>
                      <p className="text-2xl font-black text-brand mt-1 tracking-tighter">₹{myActiveLoan.remaining.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Next EMI</p>
                      <p className="text-sm font-black mt-1" style={{ color: 'var(--text-color)' }}>₹{Math.min(myActiveLoan.remaining, isMinor ? 250 : 2500).toLocaleString()}</p>
                   </div>
                </div>
                
                <button 
                  onClick={handleRepay}
                  className="w-full py-3 border-2 border-brand text-brand rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand hover:text-black transition-all relative z-10"
                >
                  PAY EMI NOW
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
