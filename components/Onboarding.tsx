
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Wallet, ShieldCheck, 
  ShoppingBag, Landmark, TrendingUp, Target, Star,
  ArrowRight, Coins
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  theme: 'light' | 'dark';
}

const ONBOARDING_SLIDES = [
  {
    title: "FlowScore Dashboard",
    description: "AI‑powered expense analytics with lifestyle categories and smart recommendations to save 20–30%.",
    icon: <BarChart3 className="w-12 h-12" />,
    color: "#00FFA3",
    gradient: "from-emerald-500/20 to-transparent"
  },
  {
    title: "FlowPay Ecosystem",
    description: "UPI + Cards + BNPL in one checkout. Track subscriptions and master cross‑border payments.",
    icon: <Wallet className="w-12 h-12" />,
    color: "#3B82F6",
    gradient: "from-blue-500/20 to-transparent"
  },
  {
    title: "FlowCredit Intelligence",
    description: "Real‑time CIBIL scores with actionable nudges to build your credit-worthy future.",
    icon: <ShieldCheck className="w-12 h-12" />,
    color: "#D4A017",
    gradient: "from-amber-500/20 to-transparent"
  },
  {
    title: "FlowBNPL Freedom",
    description: "1-tap checkout on Myntra, Zomato & more. Flexible 3/6/12‑month terms for your lifestyle.",
    icon: <ShoppingBag className="w-12 h-12" />,
    color: "#EC4899",
    gradient: "from-pink-500/20 to-transparent"
  },
  {
    title: "FlowLend Support",
    description: "Instant personal loans up to ₹50L with our smart loan optimization engine.",
    icon: <Landmark className="w-12 h-12" />,
    color: "#F59E0B",
    gradient: "from-orange-500/20 to-transparent"
  },
  {
    title: "FlowInvest Wealth",
    description: "Fractional stock buying (₹500+) and curated mutual fund collections for beginners.",
    icon: <TrendingUp className="w-12 h-12" />,
    color: "#10B981",
    gradient: "from-green-500/20 to-transparent"
  },
  {
    title: "FlowGoals Tracker",
    description: "Lifestyle goal tracking for your next iPhone or trip with AI‑powered savings logic.",
    icon: <Target className="w-12 h-12" />,
    color: "#EF4444",
    gradient: "from-red-500/20 to-transparent"
  },
  {
    title: "FlowExperiences",
    description: "FlowCoin rewards, exclusive concert deals, and premium member perks for the elite.",
    icon: <Star className="w-12 h-12" />,
    color: "#FBBF24",
    gradient: "from-yellow-500/20 to-transparent"
  }
];

const AUTO_PLAY_DURATION = 5000; // Change slide every 5 seconds

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, theme }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      // If it's the last slide, we stop auto-playing and let the user click
    }
  }, [currentSlide]);

  const handleManualNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    // Only auto-advance if not on the last slide
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      const timer = setInterval(() => {
        nextSlide();
      }, AUTO_PLAY_DURATION);
      return () => clearInterval(timer);
    }
  }, [currentSlide, nextSlide]);

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="h-screen w-full max-w-md mx-auto relative overflow-hidden flex flex-col theme-transition" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="currency-particle text-brand font-black text-2xl"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 12}s`
            }}
          >
            {i % 4 === 0 ? '₹' : i % 4 === 1 ? <div className="w-6 h-3 bg-brand/30 border border-brand/40 rounded-sm rotate-12" /> : i % 4 === 2 ? <Coins className="w-4 h-4" /> : <TrendingUp className="w-3 h-3" />}
          </div>
        ))}
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 text-center relative z-10">
        <div key={currentSlide} className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
          <div 
            className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl animate-float bg-gradient-to-br ${slide.gradient}`}
            style={{ color: slide.color, boxShadow: `0 20px 50px ${slide.color}22` }}
          >
            {slide.icon}
          </div>
          
          <h2 className="text-4xl font-black tracking-tighter mb-4" style={{ color: 'var(--text-color)' }}>
            {slide.title}
          </h2>
          
          <p className="text-sm font-medium leading-relaxed text-gray-400 max-w-[280px]">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Progress & Actions - Updated to match screenshot exactly */}
      <div className="p-10 pb-16 space-y-10 relative z-10 flex flex-col items-center">
        
        {/* Segmented Progress Bar as per Screenshot */}
        <div className="glass px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          {ONBOARDING_SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-700 ${i === currentSlide ? 'w-8 bg-brand' : 'w-1.5 bg-gray-600/50'}`}
            />
          ))}
        </div>

        {/* Large Brand Continue Button */}
        <button 
          onClick={handleManualNext}
          className="w-full h-18 bg-brand text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-between px-8 group transition-all hover:scale-[1.02] active:scale-95"
          style={{ boxShadow: '0 15px 35px var(--brand-glow)', height: '76px' }}
        >
          <span className="flex-1 text-center font-black text-lg">
            {currentSlide === ONBOARDING_SLIDES.length - 1 ? "Let's Flow" : "Continue"}
          </span>
          <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-6 h-6" />
          </div>
        </button>
        
        <button 
          onClick={onComplete}
          className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 hover:text-brand transition-colors"
        >
          Skip Introduction
        </button>
      </div>

      {/* Decorative Bottom Glow */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-64 h-64 bg-brand/5 blur-[120px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default Onboarding;
