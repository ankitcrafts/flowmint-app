
import React from 'react';
import { Briefcase, Gem, GraduationCap, ChevronRight, Star, ShieldCheck, Zap } from 'lucide-react';

const FlowLend: React.FC = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tighter">Partner Capital</h2>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Powered by trusted NBFCs</p>
      </div>

      <div className="p-8 mint-gradient rounded-[2.5rem] text-black relative overflow-hidden shadow-2xl theme-transition" style={{ boxShadow: '0 20px 40px var(--brand-glow)' }}>
        <div className="absolute top-0 right-0 p-6 opacity-20">
          <Zap className="w-32 h-32 rotate-12 fill-black" />
        </div>
        <div className="relative z-10">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-black/10 px-4 py-1.5 rounded-full">Pre-Approved for you</span>
          <h3 className="text-3xl font-black mt-6 tracking-tighter">₹5,00,000</h3>
          <p className="text-sm font-bold opacity-80 mt-1">Starting @ 10.5% interest</p>
          <button className="mt-8 w-full py-4 bg-black text-brand rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all theme-transition">
            Get Instant Cash
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="font-black text-lg">Lending Partners</h3>
        <div className="space-y-3">
          <PartnerOffer 
            icon={<Briefcase className="w-5 h-5 text-orange-400" />}
            partner="HDFC Bank"
            maxAmount="₹15 Lakhs"
            interest="9.25%"
            type="Personal"
          />
          <PartnerOffer 
            icon={<Gem className="w-5 h-5 text-yellow-400" />}
            partner="Muthoot Finance"
            maxAmount="₹50 Lakhs"
            interest="8.0%"
            type="Gold Loan"
          />
          <PartnerOffer 
            icon={<GraduationCap className="w-5 h-5 text-brand" />}
            partner="ICICI Bank"
            maxAmount="₹40 Lakhs"
            interest="10.5%"
            type="Edu Loan"
          />
        </div>
      </section>

      <div className="glass rounded-3xl p-5 border flex gap-4 bg-white/[0.02] theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
        <ShieldCheck className="w-8 h-8 text-brand shrink-0" />
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand">Regulated Access</p>
          <p className="text-[10px] text-gray-500 leading-relaxed font-bold">FlowMint is a technology partner and not a licensed NBFC. All loans are processed by regulated banking partners in compliance with RBI guidelines.</p>
        </div>
      </div>
    </div>
  );
};

const PartnerOffer = ({ icon, partner, maxAmount, interest, type }: { icon: React.ReactNode, partner: string, maxAmount: string, interest: string, type: string }) => (
  <div className="flex items-center justify-between p-5 glass rounded-3xl border hover:border-brand transition-all cursor-pointer group theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--card-subtle)' }}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
           <p className="font-black text-sm tracking-tight">{partner}</p>
           <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase font-black" style={{ backgroundColor: 'var(--card-subtle)' }}>{type}</span>
        </div>
        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Limit: {maxAmount}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xs font-black text-brand tracking-tighter">{interest} p.a.</p>
      <ChevronRight className="w-4 h-4 text-gray-400 mt-1 ml-auto" />
    </div>
  </div>
);

export default FlowLend;
