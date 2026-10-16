import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { financialProfileService, type FinancialProfile } from '../services/apiService';

interface FinancialProfileViewProps {
  userProfile?: { name: string; email: string; avatar: string } | null;
}

const formatMoney = (amount: number | null) =>
  `₹${Number(amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const FinancialProfileView: React.FC<FinancialProfileViewProps> = ({ userProfile }) => {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    financialProfileService.get()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((loadError) => {
        console.error('Unable to load financial profile:', loadError);
        if (active) setError('Your financial profile could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="mx-auto max-w-3xl space-y-6 pb-24 md:pb-6">
      <header className="flex items-center gap-4">
        {userProfile?.avatar
          ? <img src={userProfile.avatar} alt="Profile" className="h-14 w-14 rounded-full border-2 border-brand object-cover" />
          : <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand text-brand"><User className="h-6 w-6" /></div>}
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Your account</p>
          <h1 className="mt-1 truncate text-2xl font-black" style={{ color: 'var(--text-color)' }}>{userProfile?.name || 'FlowMint User'}</h1>
          <p className="truncate text-sm text-gray-500">{userProfile?.email || 'Verified email session'}</p>
        </div>
      </header>

      <section className="rounded-3xl border p-6" style={{ borderColor: 'var(--glass-border)' }}>
        <h2 className="font-black" style={{ color: 'var(--text-color)' }}>Your financial profile</h2>
        <p className="mt-1 text-xs text-gray-500">Figures you provided for planning; these are not linked bank balances.</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        ) : !error && profile ? (
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <ProfileAmount label="Monthly income" amount={profile.monthly_income} />
            <ProfileAmount label="Monthly expenses" amount={profile.monthly_expenses} />
            <ProfileAmount label="Current savings" amount={profile.current_savings} />
            <ProfileAmount label="Monthly rent / EMI" amount={profile.monthly_rent_emi} />
          </dl>
        ) : !error ? (
          <p className="mt-4 text-sm text-gray-500">No financial profile has been saved yet.</p>
        ) : null}
      </section>
    </section>
  );
};

const ProfileAmount: React.FC<{ label: string; amount: number | null }> = ({ label, amount }) => (
  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)' }}>
    <dt className="text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</dt>
    <dd className="mt-2 text-lg font-black" style={{ color: 'var(--text-color)' }}>{formatMoney(amount)}</dd>
  </div>
);

export default FinancialProfileView;
