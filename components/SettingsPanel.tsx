import { FC } from 'react';
import { motion } from 'framer-motion';
import { X, User, Bell, Shield, LogOut, Sun, Moon, ChevronRight, HelpCircle, FileText } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  onLogout: () => void;
  userProfile: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const SettingsPanel: FC<SettingsPanelProps> = ({ onClose, onLogout, userProfile, theme, toggleTheme }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-[85%] max-w-sm z-[70] flex flex-col theme-transition shadow-2xl"
        style={{ backgroundColor: 'var(--bg-color)', borderLeft: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--glass-border)' }}>
          <h2 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" style={{ color: 'var(--text-color)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="Profile" className="w-16 h-16 rounded-full border-2 border-brand shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-brand shadow-lg flex items-center justify-center">
                <User className="h-7 w-7 text-brand" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>{userProfile?.name || 'FlowMint User'}</h3>
              <p className="text-sm text-gray-500">{userProfile?.email || ''}</p>
            </div>
          </div>

          {/* Settings Options */}
          <div className="space-y-3">
            <SettingsOption icon={<User className="text-brand" />} title="Personal Information" subtitle="Not available in V1" />
            <SettingsOption icon={<Bell className="text-brand" />} title="Notifications" subtitle="Not available in V1" />
            <SettingsOption icon={<Shield className="text-emerald-400" />} title="Security" subtitle="Not available in V1" />
          </div>

          {/* Preferences & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Preferences & Support</h4>
            <div className="space-y-3">
              <div 
                className="flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:border-brand/30"
                style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}
                onClick={toggleTheme}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full glass">
                    {theme === 'dark' ? <Moon className="w-5 h-5 text-brand" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>Appearance</h5>
                    <p className="text-xs text-gray-500">{theme === 'dark' ? 'Dark' : 'Light'} Mode enabled</p>
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full relative transition-colors" style={{ backgroundColor: theme === 'dark' ? 'var(--brand-primary)' : '#e5e7eb' }}>
                  <motion.div 
                    className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: theme === 'dark' ? 24 : 0 }}
                  />
                </div>
              </div>

              <SettingsOption icon={<HelpCircle className="text-purple-400" />} title="Help & Support" subtitle="Get help or contact us" />
              <SettingsOption icon={<FileText className="text-orange-400" />} title="Terms & Policies" subtitle="Read our rules & terms" />
            </div>
          </div>

        </div>

        <div className="p-6 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </motion.div>
    </>
  );
};

const SettingsOption: FC<{ icon: React.ReactNode, title: string, subtitle: string }> = ({ icon, title, subtitle }) => (
  <button disabled aria-disabled="true" title={`${title} is not available in V1`} className="w-full flex items-center justify-between p-4 rounded-2xl border opacity-60 cursor-not-allowed"
          style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}>
    <div className="flex items-center gap-4">
      <div className="p-2 rounded-full glass relative overflow-hidden group">
        <div className="absolute inset-0 bg-current opacity-10 group-hover:opacity-20 transition-opacity" />
        {icon}
      </div>
      <div className="text-left">
        <h5 className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>{title}</h5>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </button>
);

export default SettingsPanel;
