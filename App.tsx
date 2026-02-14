
import { useState, useEffect, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  Zap,
  Target,
  Bell,
  Plus,
  ShieldCheck,
  Sun,
  Moon,
  Receipt,
  Calculator,
  Heart,
  Sparkles,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import FlowPay from './components/FlowPay';
import FlowCredit from './components/FlowCredit';
import FlowGoals from './components/FlowGoals';
import FlowLend from './components/FlowLend';
import ExpenseTracker from './components/ExpenseTracker';
import BillReminders from './components/BillReminders';
import AIWishTracker from './components/AIWishTracker';
import LoanMarketplace from './components/LoanMarketplace';
import AIInsights from './components/AIInsights';
import Auth from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './services/supabase';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

enum Tab {
  Dashboard = 'dashboard',
  Pay = 'pay',
  Credit = 'credit',
  Goals = 'goals',
  Lend = 'lend',
  Expenses = 'expenses',
  Bills = 'bills',
  Wishes = 'wishes',
  Loans = 'loans',
  AI = 'ai',
}

const App: FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile({
          name: data.name,
          email: 'user@flowmint.com',
          avatar: data.avatar_url
        });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      }
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
         fetchProfile(session.user.id);
      } else {
         setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoginSuccess = (profile?: UserProfile) => {
    if (profile) setUserProfile(profile);
    setIsAuthenticated(true);
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
    setShowMore(false);
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full animate-ping opacity-25" style={{ borderColor: 'var(--brand-primary)' }}></div>
          <div className="absolute inset-0 border-4 border-t-brand border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="flex items-center justify-center h-full">
            <Zap className="w-8 h-8 text-brand fill-brand" />
          </div>
        </div>
        <h1 className="mt-8 text-2xl font-bold tracking-tighter text-white">FlowMint</h1>
        <p className="text-gray-500 text-sm mt-2">Control your spend. Build your future.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <Auth onLoginSuccess={handleLoginSuccess} theme={theme} />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dashboard: return <Dashboard theme={theme} userProfile={userProfile} onNavigate={handleNavigate} />;
      case Tab.Pay: return <FlowPay />;
      case Tab.Credit: return <FlowCredit />;
      case Tab.Goals: return <FlowGoals />;
      case Tab.Lend: return <FlowLend />;
      case Tab.Expenses: return <ExpenseTracker />;
      case Tab.Bills: return <BillReminders />;
      case Tab.Wishes: return <AIWishTracker />;
      case Tab.Loans: return <LoanMarketplace />;
      case Tab.AI: return <AIInsights />;
      default: return <Dashboard theme={theme} userProfile={userProfile} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`min-h-screen pb-24 max-w-md mx-auto relative theme-transition`}>
      <header className="sticky top-0 z-50 p-4 glass flex items-center justify-between theme-transition" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="font-extrabold text-xl tracking-tighter" style={{ color: 'var(--text-color)' }}>FlowMint</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-brand" />}
          </button>
          <button className="relative p-2 rounded-full hover:bg-black/5">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2" style={{ borderColor: 'var(--bg-color)' }}></span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand theme-transition"
          >
            <img src={userProfile?.avatar || "https://picsum.photos/seed/user1/100/100"} alt="Avatar" />
          </button>
        </div>
      </header>

      <main className="p-4">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowMore(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 max-w-md mx-auto rounded-t-[2.5rem] p-6 pb-10 theme-transition"
              style={{ backgroundColor: 'var(--bg-color)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: 'var(--glass-border)' }}></div>
              <h3 className="font-black text-lg mb-4" style={{ color: 'var(--text-color)' }}>All Features</h3>
              <div className="grid grid-cols-3 gap-3">
                <MoreMenuItem icon={<Receipt className="w-5 h-5" />} label="Expenses" color="text-orange-400" onTap={() => handleNavigate('expenses')} />
                <MoreMenuItem icon={<Bell className="w-5 h-5" />} label="Bill Reminders" color="text-yellow-400" onTap={() => handleNavigate('bills')} />
                <MoreMenuItem icon={<Heart className="w-5 h-5" />} label="Wish Tracker" color="text-pink-400" onTap={() => handleNavigate('wishes')} />
                <MoreMenuItem icon={<Calculator className="w-5 h-5" />} label="Loan Market" color="text-blue-400" onTap={() => handleNavigate('loans')} />
                <MoreMenuItem icon={<Sparkles className="w-5 h-5" />} label="AI Advisor" color="text-brand" onTap={() => handleNavigate('ai')} />
                <MoreMenuItem icon={<Wallet className="w-5 h-5" />} label="UPI Pay" color="text-cyan-400" onTap={() => handleNavigate('pay')} />
                <MoreMenuItem icon={<ShieldCheck className="w-5 h-5" />} label="Credit Score" color="text-brand" onTap={() => handleNavigate('credit')} />
                <MoreMenuItem icon={<Target className="w-5 h-5" />} label="Goals" color="text-purple-400" onTap={() => handleNavigate('goals')} />
                <MoreMenuItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" color="text-brand" onTap={() => handleNavigate('dashboard')} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t px-4 py-3 z-50 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)] theme-transition" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between">
          <NavButton
            active={activeTab === Tab.Dashboard}
            onClick={() => setActiveTab(Tab.Dashboard)}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Home"
          />
          <NavButton
            active={activeTab === Tab.Expenses}
            onClick={() => setActiveTab(Tab.Expenses)}
            icon={<Receipt className="w-5 h-5" />}
            label="Expenses"
          />
          <div className="relative -mt-10">
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-14 h-14 mint-gradient rounded-full flex items-center justify-center shadow-lg border-4 theme-transition"
              style={{ borderColor: 'var(--bg-color)', boxShadow: '0 10px 20px var(--brand-glow)' }}
            >
              {showMore ? <X className="w-7 h-7 text-black" /> : <Plus className="w-7 h-7 text-black" />}
            </button>
          </div>
          <NavButton
            active={activeTab === Tab.Credit}
            onClick={() => setActiveTab(Tab.Credit)}
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Credit"
          />
          <NavButton
            active={activeTab === Tab.AI}
            onClick={() => setActiveTab(Tab.AI)}
            icon={<Sparkles className="w-5 h-5" />}
            label="AI"
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton: FC<{ active: boolean, onClick: () => void, icon: ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center transition-all duration-300 ${active ? 'text-brand' : 'text-gray-500'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
      {icon}
    </div>
    <span className="text-[9px] mt-1 font-bold uppercase tracking-wider">{label}</span>
  </button>
);

const MoreMenuItem: FC<{ icon: ReactNode, label: string, color: string, onTap: () => void }> = ({ icon, label, color, onTap }) => (
  <button
    onClick={onTap}
    className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:border-brand/30 theme-transition"
    style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
  >
    <div className={color}>{icon}</div>
    <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider text-center leading-tight">{label}</span>
  </button>
);

export default App;
