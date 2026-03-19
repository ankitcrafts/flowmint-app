import { FC } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Shield, Star, Award, ChevronRight, CheckCircle2, TrendingUp, CreditCard, Activity } from 'lucide-react';

interface UserProfileProps {
  userProfile: any;
  theme: 'light' | 'dark';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

const UserProfile: FC<UserProfileProps> = ({ userProfile, theme }) => {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-20"
    >
      {/* Header Profile Section */}
      <motion.div variants={itemVariants} className="relative mb-8 mt-2">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-cyan-500/10 to-transparent rounded-[2rem] blur-xl h-48" />
        <div className="relative glass p-6 rounded-[2rem] border flex flex-col items-center text-center overflow-hidden" style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-bg)' }}>
          <div className="absolute top-0 left-0 w-full h-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand/20 via-cyan-500/20 to-brand/20 opacity-50" />
            <motion.div 
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'linear-gradient(45deg, transparent 45%, var(--brand-primary) 50%, transparent 55%)',
                backgroundSize: '200% 200%'
              }}
            />
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="relative z-10 w-24 h-24 mt-4 mb-4 rounded-full p-1 shadow-2xl cursor-pointer"
            style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, #06b6d4 100%)' }}
          >
            <img 
              src={userProfile?.avatar || "https://picsum.photos/seed/user1/100/100"} 
              className="w-full h-full rounded-full object-cover border-4 border-black transition-transform duration-300" 
              style={{ borderColor: 'var(--bg-color)' }}
              alt="Avatar" 
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black text-black shadow-lg hover:scale-110 transition-transform"
                    style={{ backgroundColor: 'var(--brand-primary)', borderColor: 'var(--bg-color)' }}>
              <Edit3 className="w-4 h-4" />
            </button>
          </motion.div>

          <h2 className="text-2xl font-black mb-1 tracking-tight" style={{ color: 'var(--text-color)' }}>{userProfile?.name || 'FlowMint User'}</h2>
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-sm font-medium" style={{ color: 'var(--text-color)', opacity: 0.7 }}>{userProfile?.email || 'user@flowmint.com'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer transition-colors shadow-lg" 
            style={{ 
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <Award className="w-4 h-4 text-brand" />
            <span className="text-xs font-black text-brand uppercase tracking-wider">Premium Member</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-8">
        <StatCard icon={<TrendingUp className="text-emerald-400" />} label="Flow Score" value="842" trend="+12 pts" trendColor="text-emerald-400" />
        <StatCard icon={<Star className="text-yellow-400" />} label="Rewards" value="2,450" trend="Flow Coins" trendColor="text-yellow-400" />
      </motion.div>

      {/* Account Details / Actions */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-color)' }}>Account & Security</h3>
        </div>
        
        <ActionRow icon={<Shield className="text-emerald-400" />} title="Biometric Security" subtitle="Face ID & Touch ID enabled" active />
        <ActionRow icon={<CreditCard className="text-blue-400" />} title="Payment Methods" subtitle="2 Cards, 1 Bank Account" />
        <ActionRow icon={<Activity className="text-purple-400" />} title="Recent Activity" subtitle="Login from new device today" />
        
      </motion.div>
    </motion.div>
  );
};

const StatCard: FC<{ icon: React.ReactNode, label: string, value: string, trend: string, trendColor: string }> = ({ icon, label, value, trend, trendColor }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass p-5 rounded-[2rem] border relative overflow-hidden group cursor-pointer" 
    style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}
  >
    <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-125 duration-500">
      <div className="w-24 h-24">{icon}</div>
    </div>
    <div className="flex items-center gap-2 mb-3">
      <div className="p-2 rounded-xl glass bg-black/5 dark:bg-white/5">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-color)', opacity: 0.6 }}>{label}</span>
    </div>
    <h4 className="text-3xl font-black mb-1 tracking-tighter" style={{ color: 'var(--text-color)' }}>{value}</h4>
    <p className={`text-xs font-bold ${trendColor}`}>{trend}</p>
  </motion.div>
);

const ActionRow: FC<{ icon: React.ReactNode, title: string, subtitle: string, active?: boolean }> = ({ icon, title, subtitle, active }) => (
  <motion.button 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="w-full flex items-center justify-between p-4 rounded-3xl border transition-all hover:border-brand/50 group"
    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-2xl glass relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-current opacity-10 group-hover:opacity-20 transition-opacity" />
        {icon}
      </div>
      <div className="text-left">
        <h5 className="font-bold text-sm mb-0.5 tracking-tight" style={{ color: 'var(--text-color)' }}>{title}</h5>
        <p className="text-xs font-medium" style={{ color: 'var(--text-color)', opacity: 0.5 }}>{subtitle}</p>
      </div>
    </div>
    {active ? (
      <div className="w-12 h-6 rounded-full relative flex items-center transition-colors" style={{ backgroundColor: 'var(--brand-primary)' }}>
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: 24 }}
          className="w-5 h-5 bg-white rounded-full absolute shadow-sm" 
        />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors">
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
      </div>
    )}
  </motion.button>
);

export default UserProfile;
