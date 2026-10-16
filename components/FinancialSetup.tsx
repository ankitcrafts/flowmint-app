import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { financialProfileService } from '../services/apiService';

interface FinancialSetupProps {
  email?: string;
  onComplete: () => void;
}

const fields = [
  { key: 'monthly_income', label: 'Monthly income', hint: 'Take-home income per month' },
  { key: 'monthly_expenses', label: 'Monthly expenses', hint: 'Regular monthly expenses, excluding rent/EMI' },
  { key: 'current_savings', label: 'Current savings', hint: 'Your current savings balance' },
  { key: 'monthly_rent_emi', label: 'Monthly rent / EMI', hint: 'Your combined monthly rent and EMI commitments' },
] as const;

type FieldKey = typeof fields[number]['key'];
type FormValues = Record<FieldKey, string>;

const FinancialSetup: React.FC<FinancialSetupProps> = ({ email, onComplete }) => {
  const [values, setValues] = useState<FormValues>({
    monthly_income: '',
    monthly_expenses: '',
    current_savings: '',
    monthly_rent_emi: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const parsed = Object.fromEntries(
      fields.map(({ key }) => [key, Number(values[key])])
    ) as Record<FieldKey, number>;

    if (fields.some(({ key }) => !values[key].trim() || !Number.isFinite(parsed[key]) || parsed[key] < 0)) {
      setError('Enter a valid non-negative amount in every field.');
      return;
    }

    setSaving(true);
    try {
      await financialProfileService.save(parsed);
      onComplete();
    } catch (saveError) {
      console.error('Unable to save financial profile:', saveError);
      setError('We could not save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen w-full max-w-xl mx-auto flex items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="w-full space-y-7">
        <div>
          <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center mb-6">
            <Zap className="w-7 h-7 text-black fill-black" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Your AI Financial Copilot</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight" style={{ color: 'var(--text-color)' }}>
            Welcome to FlowMint 👋
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Let’s understand your money. Enter your own figures to get a useful starting picture.
          </p>
          {email && <p className="mt-2 text-xs text-gray-500">{email}</p>}
        </div>

        <div className="space-y-4">
          {fields.map(({ key, label, hint }) => (
            <label key={key} className="block space-y-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>{label}</span>
              <span className="block text-xs text-gray-500">{hint}</span>
              <span className="flex items-center rounded-2xl border px-4" style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}>
                <span className="text-gray-500">₹</span>
                <input
                  type="number"
                  min="0"
                  max="1000000000"
                  step="0.01"
                  required
                  value={values[key]}
                  onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full bg-transparent p-4 outline-none"
                  style={{ color: 'var(--text-color)' }}
                  aria-label={label}
                />
              </span>
            </label>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-4 font-black text-black disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Continue <ArrowRight className="h-5 w-5" /></>}
        </button>
      </form>
    </main>
  );
};

export default FinancialSetup;
