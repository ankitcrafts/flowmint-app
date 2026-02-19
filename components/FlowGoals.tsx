
import React, { useState } from 'react';
import { Target, Plus, Smartphone, Plane, Bike, GraduationCap, Sparkles, ChevronRight } from 'lucide-react';
import { llmService } from '../services/llmService';

const FlowGoals: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const fetchPlan = async (goal: string, amount: number) => {
    setLoading(true);
    try {
      const plan = await llmService.getWishPlan({
        wishName: goal,
        price: amount,
        currentSavings: 15000,
      });
      setAiTip(`${plan.aiTip}\n\n${plan.speedUpTip}\n\nSteps:\n${plan.savingSteps.join('\n')}`);
    } catch {
      setAiTip('Start by automating ₹2,000 every week into your goal pot.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">AI Wish Tracker</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Achieve your lifestyle goals</p>
        </div>
        <button className="w-12 h-12 bg-brand rounded-2xl text-black flex items-center justify-center shadow-lg theme-transition" style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}>
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <GoalCard 
          icon={<Plane className="w-6 h-6 text-blue-400" />}
          name="Tokyo Trip 2025"
          current={125000}
          target={250000}
          onAIAssist={() => fetchPlan("Tokyo Trip", 250000)}
        />
        <GoalCard 
          icon={<Smartphone className="w-6 h-6 text-purple-400" />}
          name="MacBook Pro M4"
          current={45000}
          target={180000}
          onAIAssist={() => fetchPlan("MacBook Pro M4", 180000)}
        />
      </div>

      { (loading || aiTip) && (
        <div className="glass rounded-[2rem] p-6 border bg-gradient-to-br from-brand/10 to-transparent animate-in zoom-in-95 duration-300 theme-transition" style={{ borderColor: 'var(--brand-primary)', boxShadow: '0 10px 30px var(--brand-glow)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand" />
            <h3 className="font-black text-brand text-sm uppercase tracking-widest">Master Strategy</h3>
          </div>
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap" style={{ color: 'var(--text-color)' }}>{aiTip}</p>
              <button 
                onClick={() => setAiTip(null)}
                className="w-full py-4 bg-white/5 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 theme-transition"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                Dismiss Strategy
              </button>
            </div>
          )}
        </div>
      )}

      <section className="space-y-4">
        <h3 className="font-black text-lg">Recommended Plans</h3>
        <div className="grid grid-cols-2 gap-4">
          <NewGoalOption icon={<GraduationCap />} label="Masters Fund" color="text-yellow-400" />
          <NewGoalOption icon={<Bike />} label="New Ride" color="text-red-400" />
        </div>
      </section>
    </div>
  );
};

const GoalCard = ({ icon, name, current, target, onAIAssist }: { icon: React.ReactNode, name: string, current: number, target: number, onAIAssist: () => void }) => {
  const progress = (current / target) * 100;
  return (
    <div className="glass p-6 rounded-[2rem] border space-y-5 theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
            {icon}
          </div>
          <div>
            <h4 className="font-black text-sm tracking-tight">{name}</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase">₹{target.toLocaleString()} Needed</p>
          </div>
        </div>
        <button 
          onClick={onAIAssist}
          className="p-2.5 bg-white/5 hover:bg-brand/10 rounded-xl text-brand transition-all theme-transition"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-500">
          <span>{Math.round(progress)}% Focused</span>
          <span style={{ color: 'var(--text-color)' }}>₹{current.toLocaleString()} Saved</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-subtle)' }}>
          <div 
            className="h-full bg-brand transition-all duration-1000 ease-out shadow-[0_0_10px_var(--brand-glow)] shimmer-bar animate-pulse-glow" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const NewGoalOption = ({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) => (
  <button className="flex flex-col items-start gap-4 p-5 glass rounded-[2rem] border hover:border-brand transition-all text-left theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
    <div className={`p-2 bg-white/5 rounded-xl ${color}`} style={{ backgroundColor: 'var(--card-subtle)' }}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    </div>
    <div className="flex items-center justify-between w-full">
      <span className="font-black text-xs tracking-tight">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-600" />
    </div>
  </button>
);

export default FlowGoals;
