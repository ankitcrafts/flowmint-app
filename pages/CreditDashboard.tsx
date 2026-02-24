import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';
import RiskIndicator from '../components/finance/RiskIndicator';

const CreditDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate API fetch from /api/analytics and /api/credit
    setTimeout(() => {
      setData({
        analytics: {
          credit_utilization_ratio: 42,
          emi_burden_ratio: 28,
          debt_to_income_ratio: 15,
          interest_projection: 4500,
          risk_level: 'Moderate'
        },
        accounts: [
          { id: '1', issuer_name: 'HDFC Bank', masked_card_number: 'XXXX-4321', total_outstanding: 25000, credit_limit: 100000, due_date: '2026-03-15', autopay_enabled: true },
          { id: '2', issuer_name: 'ICICI Bank', masked_card_number: 'XXXX-8888', total_outstanding: 17000, credit_limit: 50000, due_date: '2026-03-10', autopay_enabled: false }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="p-8 text-brand">Loading Financial Core...</div>;

  // Use brand colors for charts
  const brandPrimary = getComputedStyle(document.body).getPropertyValue('--brand-primary').trim() || '#00ffa3';
  const brandSecondary = getComputedStyle(document.body).getPropertyValue('--brand-secondary').trim() || '#00d1ff';
  
  const COLORS = [brandPrimary, brandSecondary, '#ec4899', '#f59e0b'];

  const utilizationData = [
    { name: 'Used', value: 42000 },
    { name: 'Available', value: 108000 }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto mb-20" style={{ color: 'var(--text-color)' }}>
      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-yellow-500 text-[10px] text-center">
        🛡️ Data shown is based on user-uploaded statements. <b>Not connected to live bank APIs.</b>
      </div>

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Financial Command</h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Verification Mode</p>
        </div>
        <RiskIndicator level={data.analytics.risk_level} />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Outstanding', val: '₹42,000', sub: 'Across 2 cards' },
          { label: 'Utilization', val: `${data.analytics.credit_utilization_ratio}%`, sub: 'Target < 30%' },
          { label: 'EMI Burden', val: `${data.analytics.emi_burden_ratio}%`, sub: 'Of monthly income' },
          { label: 'Debt to Income', val: `${data.analytics.debt_to_income_ratio}%`, sub: 'Healthy level' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-4 rounded-2xl"
          >
            <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-color)' }}>{stat.val}</p>
            <p className="text-[9px] text-gray-400 mt-1 opacity-60">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Utilization Pie */}
        <div className="glass p-6 rounded-3xl h-[280px] relative">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Credit Utilization</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={utilizationData}
                innerRadius={60}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {utilizationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--glass-border)', color: 'var(--text-color)', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4">
            <span className="text-2xl font-black" style={{ color: 'var(--text-color)' }}>42%</span>
          </div>
        </div>

        {/* EMI Burden Bar */}
        <div className="glass p-6 rounded-3xl h-[280px]">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">EMI vs Income</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={[{ name: 'EMI', value: 14000 }, { name: 'Free Cash', value: 36000 }]}>
              <XAxis dataKey="name" stroke="var(--glass-border)" fontSize={10} tick={{ fill: 'var(--text-color)', opacity: 0.5 }} />
              <YAxis hide />
              <Bar dataKey="value" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--glass-border)', color: 'var(--text-color)', fontSize: '12px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Future Interest Projection Area */}
        <div className="glass p-6 rounded-3xl h-[280px] lg:col-span-1 md:col-span-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Interest Forecast</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={[
              { month: 'Mar', val: 4200 },
              { month: 'Apr', val: 3800 },
              { month: 'May', val: 3100 },
              { month: 'Jun', val: 2400 },
              { month: 'Jul', val: 1800 },
              { month: 'Aug', val: 1200 },
            ]}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="var(--glass-border)" fontSize={10} tick={{ fill: 'var(--text-color)', opacity: 0.5 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--glass-border)', color: 'var(--text-color)', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accounts List */}
      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--glass-border)] flex justify-between items-center">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-color)' }}>Tracked Credit Accounts</h3>
          <span className="text-[10px] text-brand font-black uppercase tracking-widest">Manual Setup</span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 uppercase text-[9px] tracking-widest border-b border-[var(--glass-border)]">
              <tr>
                <th className="px-6 py-4">Issuer</th>
                <th className="px-6 py-4">Outstanding</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {data.accounts.map((acc: any) => (
                <tr key={acc.id} className="hover:bg-brand/5 transition-colors">
                  <td className="px-6 py-5">
                    <p className="font-bold mb-0.5" style={{ color: 'var(--text-color)' }}>{acc.issuer_name}</p>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter opacity-70">{acc.masked_card_number}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold" style={{ color: 'var(--text-color)' }}>₹{acc.total_outstanding.toLocaleString()}</p>
                    <div className="w-24 bg-gray-500/10 h-1 mt-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand h-full rounded-full" 
                        style={{ width: `${(acc.total_outstanding / acc.credit_limit) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest ${acc.autopay_enabled ? 'bg-brand/20 text-brand' : 'bg-gray-500/10 text-gray-500'}`}>
                      {acc.autopay_enabled ? 'AUTOPAY ON' : 'AUTOPAY OFF'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button className="text-brand font-black text-[10px] hover:underline uppercase tracking-widest">Setup</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditDashboard;
