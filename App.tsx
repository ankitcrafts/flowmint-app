
import { useState, useEffect, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  Target,
  Bell,
  Plus,
  Sun,
  Moon,
  Receipt,
  Heart,
  Sparkles,
  X,
  Settings
} from 'lucide-react';
import FinancialCopilotDashboard from './components/FinancialCopilotDashboard';
import FinancialGoals from './components/FinancialGoals';
import ExpenseTracker from './components/ExpenseTracker';
import PersonalBills from './components/PersonalBills';
import FinancialAdvisor from './components/FinancialAdvisor';
import EmailOtpAuth from './components/EmailOtpAuth';
import FinancialSetup from './components/FinancialSetup';
import InitialSetup from './components/InitialSetup';
import ErrorBoundary from './components/ErrorBoundary';
import FinancialProfileView from './components/FinancialProfileView';
import SettingsPanel from './components/SettingsPanel';
import { financialProfileService, FlowMintError } from './services/apiService';
import { supabase } from './services/supabase';
import {
  clearGoogleOAuthPending,
  clearStoredAuthMethod,
  getStoredAuthMethod,
  isGoogleOAuthPending,
  setStoredAuthMethod,
} from './services/authMethod';

// Legacy payment, lending, credit, and rewards modules remain in source but are not routed in V1.
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  dob?: string;
  isMinor?: boolean;
  guardianId?: string;
}

const getFinancialProfileErrorMessage = (error: unknown) => {
  if (error instanceof FlowMintError) return error.userMessage;
  return 'We could not load your saved financial profile. Refresh the app and try again.';
};

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
  CreditCore = 'credit_core',
  CreditUpload = 'credit_upload',
  Profile = 'profile',
  Rewards = 'rewards',
}

const App: FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasFinancialProfile, setHasFinancialProfile] = useState(false);
  const [financialProfileLoaded, setFinancialProfileLoaded] = useState(false);
  const [financialProfileError, setFinancialProfileError] = useState('');
  const [hasCompletedPersonalSetup, setHasCompletedPersonalSetup] = useState(false);
  const [authInitializationError, setAuthInitializationError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showMore, setShowMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchProfile = async (userId: string, sessionUser?: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Unable to load FlowMint profile:', error);
        return;
      }
      if (data) {
        setUserProfile({
          name: data.name,
          email: data.email || sessionUser?.email || '',
          avatar: data.avatar_url || sessionUser?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        });
      } else if (sessionUser) {
        setUserProfile({
          name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || 'FlowMint User',
          email: sessionUser.email || '',
          avatar: sessionUser.user_metadata?.avatar_url || ''
        });
      }
    };

    const loadFinancialProfile = async () => {
      try {
        const profile = await financialProfileService.get();
        setHasFinancialProfile(!!profile &&
          profile.monthly_income !== null &&
          profile.monthly_expenses !== null &&
          profile.current_savings !== null &&
          profile.monthly_rent_emi !== null);
        setFinancialProfileError('');
      } catch (error) {
        console.error('Unable to load financial setup status:', error);
        setFinancialProfileError(getFinancialProfileErrorMessage(error));
      } finally {
        setFinancialProfileLoaded(true);
      }
    };

    let initializingAuth = true;
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        const isGoogleOAuthCallback =
          new URLSearchParams(window.location.search).has('code') && isGoogleOAuthPending();
        const storedMethod = getStoredAuthMethod();
        if (session && storedMethod !== 'google' && !isGoogleOAuthCallback) {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
          if (signOutError) throw signOutError;
          clearStoredAuthMethod();
          setIsAuthenticated(false);
          setHasFinancialProfile(false);
          setFinancialProfileLoaded(true);
        } else if (session) {
          if (isGoogleOAuthCallback) setStoredAuthMethod('google');
          clearGoogleOAuthPending();
          setIsAuthenticated(true);
          setFinancialProfileLoaded(false);
          await fetchProfile(session.user.id, session.user);
          await loadFinancialProfile();
        } else {
          clearGoogleOAuthPending();
          setFinancialProfileLoaded(true);
        }
      } catch (error) {
        console.error('Unable to initialize FlowMint authentication:', error);
        setAuthInitializationError('We could not safely restore your sign-in. Refresh the app and try again.');
        setFinancialProfileLoaded(true);
      } finally {
        initializingAuth = false;
        setIsLoaded(true);
      }
    };
    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (initializingAuth) return;
      setIsAuthenticated(!!session);
      if (session) {
         setFinancialProfileLoaded(false);
         void fetchProfile(session.user.id, session.user);
         void loadFinancialProfile();
      } else {
         setUserProfile(null);
         setHasFinancialProfile(false);
         setHasCompletedPersonalSetup(false);
         setAuthInitializationError('');
         setFinancialProfileError('');
         setFinancialProfileLoaded(true);
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

  const handleLoginSuccess = async (profile?: UserProfile) => {
    if (profile) setUserProfile(profile);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Email verification completed without an authenticated session.');
    }

    setIsAuthenticated(true);
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          avatar_url: profile.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);
      if (error) console.error('Unable to update FlowMint profile:', error);
    }

    try {
      const financialProfile = await financialProfileService.get();
      setHasFinancialProfile(!!financialProfile &&
        financialProfile.monthly_income !== null &&
        financialProfile.monthly_expenses !== null &&
        financialProfile.current_savings !== null &&
        financialProfile.monthly_rent_emi !== null);
      setFinancialProfileError('');
    } catch (error) {
      console.error('Unable to load saved financial profile after sign-in:', error);
      setFinancialProfileError(getFinancialProfileErrorMessage(error));
    } finally {
      setFinancialProfileLoaded(true);
    }
  };

  const handlePersonalSetupComplete = async (profile?: UserProfile) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Your sign-in expired before your profile could be saved. Please sign in again.');
    }

    if (profile) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          avatar_url: profile.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Your FlowMint profile could not be found. Please refresh and try again.');
      setUserProfile({ ...profile, email: session.user.email || profile.email });
    }

    setHasCompletedPersonalSetup(true);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearStoredAuthMethod();
      setIsAuthenticated(false);
      setUserProfile(null);
      setHasFinancialProfile(false);
      setHasCompletedPersonalSetup(false);
      setFinancialProfileLoaded(true);
      setShowSettings(false);
    } catch (error) {
      console.error('Unable to sign out of FlowMint:', error);
      window.alert('We could not sign you out. Please try again.');
    }
  };

  const handleNavigate = (tab: string) => {
    if ([Tab.Pay, Tab.Lend, Tab.Loans, Tab.Credit, Tab.CreditCore, Tab.CreditUpload, Tab.Rewards].includes(tab as Tab)) {
      setShowMore(false);
      return;
    }
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
        <p className="text-gray-500 text-sm mt-2">Your AI Financial Copilot</p>
      </div>
    );
  }

  if (authInitializationError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <p role="alert" className="max-w-md text-sm text-red-400">{authInitializationError}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-brand px-5 py-3 font-bold text-black">Refresh</button>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <EmailOtpAuth onLoginSuccess={handleLoginSuccess} theme={theme} />
      </ErrorBoundary>
    );
  }

  if (isAuthenticated && !financialProfileLoaded) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}><Zap className="h-8 w-8 animate-pulse text-brand" /></div>;
  }

  if (isAuthenticated && financialProfileError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <p role="alert" className="max-w-md text-sm text-red-400">{financialProfileError}</p>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-brand px-5 py-3 font-bold text-black">Refresh</button>
      </main>
    );
  }

  if (isAuthenticated && !hasFinancialProfile && !hasCompletedPersonalSetup) {
    return (
      <ErrorBoundary>
        <InitialSetup
          onComplete={handlePersonalSetupComplete}
          theme={theme}
        />
      </ErrorBoundary>
    );
  }

  if (isAuthenticated && !hasFinancialProfile) {
    return (
      <ErrorBoundary>
        <FinancialSetup email={userProfile?.email} onComplete={() => setHasFinancialProfile(true)} />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.Dashboard: return <FinancialCopilotDashboard userProfile={userProfile} onNavigate={handleNavigate} />;
      case Tab.Goals: return <FinancialGoals />;
      case Tab.Expenses: return <ExpenseTracker />;
      case Tab.Bills: return <PersonalBills />;
      case Tab.Wishes: return <FinancialGoals />;
      case Tab.AI: return <FinancialAdvisor />;
      case Tab.Profile: return <FinancialProfileView userProfile={userProfile} />;
      default: return <FinancialCopilotDashboard userProfile={userProfile} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen w-full relative theme-transition flex bg-bg overflow-x-hidden">
      <div className="noise-overlay" />

      {/* Sidebar - Visible on Tablet/Desktop (md and up) */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r theme-transition z-50 shrink-0"
             style={{ 
               backgroundColor: 'var(--nav-bg)', 
               borderColor: 'var(--glass-border)',
               backdropFilter: 'blur(12px)'
             }}>
        {/* Sidebar Header / Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 cursor-pointer w-full text-left bg-transparent border-none p-0">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter" style={{ color: 'var(--text-color)' }}>FlowMint</span>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-grow overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
          <SidebarNavButton active={activeTab === Tab.Dashboard} onClick={() => handleNavigate('dashboard')} icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <SidebarNavButton active={activeTab === Tab.Expenses} onClick={() => handleNavigate('expenses')} icon={<Receipt className="w-4 h-4" />} label="Expenses" />
          <SidebarNavButton active={activeTab === Tab.Goals} onClick={() => handleNavigate('goals')} icon={<Target className="w-4 h-4" />} label="Goals" />
          <SidebarNavButton active={activeTab === Tab.Bills} onClick={() => handleNavigate('bills')} icon={<Bell className="w-4 h-4" />} label="Bill Reminders" />
          <SidebarNavButton active={activeTab === Tab.Wishes} onClick={() => handleNavigate('wishes')} icon={<Heart className="w-4 h-4" />} label="Savings Blueprint" />
          <SidebarNavButton active={activeTab === Tab.AI} onClick={() => handleNavigate('ai')} icon={<Sparkles className="w-4 h-4" />} label="AI Advisor" />
        </div>

        {/* Sidebar Footer / User Profile & Settings */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass hover:bg-white/10 transition-colors flex-grow flex justify-center cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-brand" />}
            </button>
            <button
               onClick={() => setShowSettings(true)}
               className="p-2 rounded-xl glass hover:bg-white/10 transition-colors flex-grow flex justify-center cursor-pointer"
            >
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <button
            onClick={() => handleNavigate('profile')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 w-full text-left transition-colors cursor-pointer border-none bg-transparent"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand shrink-0">
              {userProfile?.avatar
                ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                : <span className="h-full w-full flex items-center justify-center font-bold text-brand">{userProfile?.name?.trim().charAt(0).toUpperCase() || '?'}</span>}
            </div>
            <div className="truncate">
              <p className="font-bold text-xs truncate" style={{ color: 'var(--text-color)' }}>{userProfile?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{userProfile?.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow min-h-screen flex flex-col md:max-w-none w-full max-w-md mx-auto relative">
        {/* Mobile Header (md:hidden) */}
        <header className="sticky top-0 z-50 px-[var(--card-padding)] py-4 glass flex md:hidden items-center justify-between theme-transition" 
                style={{ 
                  backgroundColor: 'var(--nav-bg)', 
                  borderColor: 'var(--glass-border)',
                  paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' 
                }}>
          <button onClick={() => handleNavigate('dashboard')} className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter" style={{ color: 'var(--text-color)' }}>FlowMint</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass hover:bg-white/10 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-brand" />}
            </button>
            <button disabled aria-label="Notifications are not available in V1" title="Notifications are not available in V1" className="relative p-2 rounded-full bg-transparent border-none opacity-50 cursor-not-allowed">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button
               onClick={() => setShowSettings(true)}
               className="relative p-2 rounded-full hover:bg-black/5 cursor-pointer bg-transparent border-none"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => handleNavigate('profile')}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-brand theme-transition cursor-pointer block p-0"
            >
              {userProfile?.avatar
                ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                : <span className="h-full w-full flex items-center justify-center text-xs font-bold text-brand">{userProfile?.name?.trim().charAt(0).toUpperCase() || '?'}</span>}
            </button>
          </div>
        </header>

        {/* Desktop Header (hidden on mobile, visible on md+) */}
        <header className="hidden md:flex sticky top-0 z-40 px-8 py-4 border-b items-center justify-between theme-transition"
                style={{ 
                  backgroundColor: 'var(--nav-bg)', 
                  borderColor: 'var(--glass-border)',
                  backdropFilter: 'blur(12px)'
                }}>
          <h2 className="text-2xl font-black tracking-tight uppercase" style={{ color: 'var(--text-color)' }}>
            {activeTab === Tab.Dashboard && 'Dashboard'}
            {activeTab === Tab.Expenses && 'Expense Tracker'}
            {activeTab === Tab.Goals && 'Savings Goals'}
            {activeTab === Tab.Bills && 'Bill Reminders'}
            {activeTab === Tab.Wishes && 'Savings Blueprint'}
            {activeTab === Tab.AI && 'Flow AI Advisor'}
            {activeTab === Tab.Profile && 'User Profile'}
          </h2>
          <div className="flex items-center gap-4">
            <button disabled aria-label="Notifications are not available in V1" title="Notifications are not available in V1" className="relative p-2 rounded-full bg-transparent border-none opacity-50 cursor-not-allowed">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--glass-border)' }}></div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">Welcome, {userProfile?.name.split(' ')[0]}!</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-[var(--card-padding)] md:px-8 py-4 md:py-6 flex-grow overflow-x-hidden md:max-w-6xl md:w-full md:mx-auto">
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
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel 
            onClose={() => setShowSettings(false)} 
            onLogout={() => void handleLogout()}
            userProfile={userProfile} 
            theme={theme} 
            toggleTheme={toggleTheme} 
          />
        )}
      </AnimatePresence>

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
                <MoreMenuItem icon={<Heart className="w-5 h-5" />} label="Savings Blueprint" color="text-pink-400" onTap={() => handleNavigate('wishes')} />
                <MoreMenuItem icon={<Sparkles className="w-5 h-5" />} label="AI Advisor" color="text-brand" onTap={() => handleNavigate('ai')} />
                <MoreMenuItem icon={<Target className="w-5 h-5" />} label="Goals" color="text-amber-500" onTap={() => handleNavigate('goals')} />
                <MoreMenuItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" color="text-brand" onTap={() => handleNavigate('dashboard')} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t px-6 py-3 z-50 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] theme-transition md:hidden" 
           style={{ 
             backgroundColor: 'var(--nav-bg)', 
             borderColor: 'var(--glass-border)',
             paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'
           }}>
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
          <div className="relative -mt-12">
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-14 h-14 mint-gradient rounded-full flex items-center justify-center shadow-lg border-4 theme-transition cursor-pointer"
              style={{ borderColor: 'var(--bg-color)', boxShadow: '0 10px 20px var(--brand-glow)' }}
            >
              {showMore ? <X className="w-7 h-7 text-black" /> : <Plus className="w-7 h-7 text-black" />}
            </button>
          </div>
          <NavButton
            active={activeTab === Tab.Bills}
            onClick={() => handleNavigate('bills')}
            icon={<Bell className="w-5 h-5" />}
            label="Bills"
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

const SidebarNavButton: FC<{ active: boolean, onClick: () => void, icon: ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-sm tracking-tight transition-all text-left cursor-pointer border-none bg-transparent ${active ? 'bg-brand text-black shadow-md shadow-brand/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

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
