
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scan, Send, Smartphone, Tv, Zap, Calendar, AlertCircle, CheckCircle2, QrCode,
  ArrowRight, Clock, CreditCard, Shield, Home, Wifi, IndianRupee, X,
  ArrowDownLeft, ArrowUpRight, Tag, ShieldCheck, Lock
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  title: string;
  amount: number;
  type: 'sent' | 'received';
  category: string;
  date: string;
  upiId: string;
  status: 'success' | 'pending' | 'failed';
}

const PAYMENT_HISTORY: PaymentRecord[] = [
  { id: '1', title: 'Swiggy Food', amount: 456, type: 'sent', category: 'Food', date: 'Today, 2:30 PM', upiId: 'swiggy@ybl', status: 'success' },
  { id: '2', title: 'Salary Credit', amount: 50000, type: 'received', category: 'Income', date: 'Today, 9:00 AM', upiId: 'employer@sbi', status: 'success' },
  { id: '3', title: 'Uber Auto', amount: 234, type: 'sent', category: 'Transport', date: 'Yesterday', upiId: 'uber@icici', status: 'success' },
  { id: '4', title: 'Amazon Pay', amount: 1299, type: 'sent', category: 'Shopping', date: 'Yesterday', upiId: 'amazon@apl', status: 'success' },
  { id: '5', title: 'Rent Transfer', amount: 15000, type: 'sent', category: 'Rent', date: '3 days ago', upiId: 'landlord@hdfc', status: 'success' },
  { id: '6', title: 'Cashback', amount: 50, type: 'received', category: 'Reward', date: '3 days ago', upiId: 'rewards@paytm', status: 'success' },
];

const FlowPay: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [view, setView] = useState<'home' | 'history'>('home');

  const simulatePayment = () => {
    setShowPayment(true);
    setTimeout(() => {
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPayment(false);
        setPaymentSuccess(false);
        setShowSendModal(false);
        setSendAmount('');
        setSendTo('');
      }, 2000);
    }, 2000);
  };

  if (isScanning) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-300">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 border-2 border-brand rounded-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-brand shadow-[0_0_15px_var(--brand-glow)] animate-bounce"></div>
          <div className="flex items-center justify-center h-full opacity-20">
            <QrCode className="w-32 h-32" style={{ color: 'var(--text-color)' }} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black" style={{ color: 'var(--text-color)' }}>Scanning for UPI QR</h3>
          <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">Hold steady to pay anywhere</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10">
          <Shield className="w-3 h-3 text-brand" />
          <span className="text-[9px] font-black text-brand uppercase tracking-widest">Simulated Mode</span>
        </div>
        <button
          onClick={() => setIsScanning(false)}
          className="px-8 py-3 rounded-2xl text-sm font-black uppercase border theme-transition"
          style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setIsScanning(true)}
          className="flex flex-col items-center justify-center p-8 mint-gradient rounded-[2rem] text-black space-y-3 group shadow-xl theme-transition"
          style={{ boxShadow: '0 10px 20px var(--brand-glow)' }}
        >
          <Scan className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Scan & Pay</span>
        </button>
        <button
          onClick={() => setShowSendModal(true)}
          className="flex flex-col items-center justify-center p-8 glass rounded-[2rem] border space-y-3 group theme-transition"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <Send className="w-8 h-8 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-color)' }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>Send Money</span>
        </button>
      </div>

      {/* Upcoming EMIs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>Upcoming EMIs</h3>
          <span className="text-[10px] bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">Critical</span>
        </div>
        <div className="space-y-3">
          <BillCard
            icon={<Smartphone className="w-5 h-5 text-brand" />}
            title="iPhone 15 EMI"
            dueDate="In 2 days"
            amount={5499}
            status="unpaid"
          />
          <BillCard
            icon={<Zap className="w-5 h-5 text-yellow-400" />}
            title="Electricity Bill"
            dueDate="In 5 days"
            amount={2100}
            status="unpaid"
          />
          <BillCard
            icon={<CheckCircle2 className="w-5 h-5 text-brand" />}
            title="Car Loan"
            dueDate="Paid"
            amount={12500}
            status="paid"
          />
        </div>
      </section>

      {/* Pay Services */}
      <section className="glass rounded-3xl p-6 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <h3 className="font-black text-sm mb-6 uppercase tracking-widest text-gray-500">Pay Services</h3>
        <div className="grid grid-cols-4 gap-4">
          <ServiceIcon icon={<Zap />} label="Power" />
          <ServiceIcon icon={<Smartphone />} label="Recharge" />
          <ServiceIcon icon={<Tv />} label="DTH" />
          <ServiceIcon icon={<Calendar />} label="Rent" />
          <ServiceIcon icon={<Wifi />} label="Broadband" />
          <ServiceIcon icon={<CreditCard />} label="Card Bill" />
          <ServiceIcon icon={<Home />} label="Housing" />
          <ServiceIcon icon={<IndianRupee />} label="SIP" />
        </div>
      </section>

      {/* View Toggle */}
      <div className="flex p-1 rounded-2xl gap-1 theme-transition" style={{ backgroundColor: 'var(--card-subtle)' }}>
        <button
          onClick={() => setView('home')}
          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'home' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
        >
          Home
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
        >
          Transaction Ledger
        </button>
      </div>

      {view === 'history' && (
        <div className="space-y-3">
          <h3 className="font-black text-lg" style={{ color: 'var(--text-color)' }}>Payment Ledger</h3>
          {PAYMENT_HISTORY.map(payment => (
            <div key={payment.id}
              className="flex items-center justify-between p-4 glass rounded-[1.8rem] border theme-transition"
              style={{ borderColor: 'var(--glass-border)' }}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payment.type === 'received' ? 'bg-brand/10' : ''}`}
                  style={{ backgroundColor: payment.type === 'sent' ? 'var(--card-subtle)' : undefined }}>
                  {payment.type === 'sent' ?
                    <ArrowUpRight className="w-4 h-4 text-red-400" /> :
                    <ArrowDownLeft className="w-4 h-4 text-brand" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{payment.title}</p>
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: 'var(--card-subtle)', color: '#9CA3AF' }}>
                      {payment.category}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold">{payment.date} • {payment.upiId}</p>
                </div>
              </div>
              <p className={`font-black text-sm ${payment.type === 'received' ? 'text-brand' : ''}`}
                style={{ color: payment.type === 'sent' ? 'var(--text-color)' : undefined }}>
                {payment.type === 'sent' ? '-' : '+'}₹{payment.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Vivid Simulated Mode Indicator ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 relative group pb-10"
      >
        <div className="absolute inset-0 bg-brand/5 blur-xl rounded-[2rem] group-hover:bg-brand/10 transition-all duration-500" />
        <div className="relative glass rounded-3xl p-5 border border-brand/10 flex flex-col items-center gap-3 text-center theme-transition">
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <ShieldCheck className="w-4 h-4 text-brand" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">Vivid Simulation Sandbox</span>
          </div>
          
          <p className="text-[9px] text-gray-500 font-bold leading-relaxed max-w-[240px]">
            FlowPay is currently in <span className="text-brand">Simulated Mode</span>. BHIM UPI & Banking integrations are active in sandbox. No real money movement.
          </p>

          <div className="flex items-center gap-4 pt-2 border-t border-brand/5 w-full justify-center">
             <div className="flex items-center gap-1.5 opacity-40">
                <span className="text-[8px] font-black italic" style={{ color: 'var(--text-color)' }}>BHIM</span>
                <div className="w-px h-2 bg-gray-500" />
                <span className="text-[8px] font-black uppercase" style={{ color: 'var(--text-color)' }}>UPI</span>
             </div>
             <div className="w-px h-3 bg-brand/10" />
             <div className="flex items-center gap-1 text-[8px] font-black text-brand">
                <Lock className="w-2.5 h-2.5" /> SECURE HANDSHAKE
             </div>
          </div>
        </div>
      </motion.div>

      {/* Send Money Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-t-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-8 duration-300"
            style={{ backgroundColor: 'var(--bg-color)' }}>
            {showPayment ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                {paymentSuccess ? (
                  <>
                    <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
                      <CheckCircle2 className="w-10 h-10 text-brand" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black" style={{ color: 'var(--text-color)' }}>Payment Simulated!</h3>
                      <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">₹{sendAmount} → {sendTo || 'user@upi'}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10">
                      <Shield className="w-3 h-3 text-brand" />
                      <span className="text-[9px] font-black text-brand uppercase tracking-widest">Simulated – Live UPI coming soon</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-black uppercase tracking-widest text-gray-500">Processing...</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Send Money</h3>
                  <button onClick={() => setShowSendModal(false)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <input
                  placeholder="UPI ID or Phone Number"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition"
                  style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
                />
                <input
                  placeholder="Amount (₹)"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value.replace(/\D/g, ''))}
                  type="tel"
                  className="w-full h-16 px-6 rounded-2xl text-2xl font-black text-center focus:outline-none border-2 theme-transition"
                  style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
                />
                <button
                  onClick={simulatePayment}
                  disabled={!sendAmount}
                  className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${!sendAmount ? 'opacity-30' : ''}`}
                  style={{ backgroundColor: 'var(--brand-primary)', color: '#000', boxShadow: '0 10px 30px var(--brand-glow)' }}
                >
                  Send ₹{sendAmount || '0'}
                </button>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-3 h-3 text-brand" />
                  <span className="text-[9px] font-black text-brand uppercase tracking-widest">Simulated – Live UPI coming soon</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BillCard = ({ icon, title, dueDate, amount, status }: { icon: React.ReactNode, title: string, dueDate: string, amount: number, status: 'paid' | 'unpaid' }) => (
  <div className={`flex items-center justify-between p-5 glass rounded-3xl border theme-transition ${status === 'paid' ? 'opacity-50' : ''}`} style={{ borderColor: 'var(--glass-border)' }}>
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{title}</p>
        <p className="text-[10px] text-gray-500 font-bold uppercase">{dueDate}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-black text-sm" style={{ color: 'var(--text-color)' }}>₹{amount}</p>
      {status === 'unpaid' && <button className="text-[10px] text-brand font-black uppercase tracking-widest mt-1">Pay Now</button>}
    </div>
  </div>
);

const ServiceIcon = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand hover:bg-brand/5 transition-all cursor-pointer" style={{ backgroundColor: 'var(--card-subtle)' }}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    </div>
    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{label}</span>
  </div>
);

export default FlowPay;
