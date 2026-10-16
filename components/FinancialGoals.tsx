import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Sparkles, Target, Trash2 } from 'lucide-react';
import { goalService, type Goal } from '../services/apiService';
import { llmService } from '../services/llmService';

const formatMoney = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const FinancialGoals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<{ goalId: string; text: string } | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);

  const loadGoals = async () => {
    setError('');
    try {
      setGoals(await goalService.getAll());
    } catch (loadError) {
      console.error('Unable to load savings goals:', loadError);
      setError('Your goals could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadGoals(); }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(targetAmount);
    if (!goalName.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Enter a goal name and a positive target amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const goal = await goalService.create({
        name: goalName.trim(),
        target_amount: amount,
        deadline: deadline || undefined,
        category: category.trim() || undefined,
      });
      setGoals((current) => [goal, ...current]);
      setGoalName('');
      setTargetAmount('');
      setDeadline('');
      setCategory('');
      setShowForm(false);
    } catch (createError) {
      console.error('Unable to create savings goal:', createError);
      setError('Your goal could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const createPlan = async (goal: Goal) => {
    setPlanningId(goal.id);
    setError('');
    try {
      const response = await llmService.getWishPlan({
        wishName: goal.name,
        price: Number(goal.target_amount),
        currentSavings: Number(goal.current_amount),
      });
      const text = `${response.aiTip}\n\n${response.speedUpTip}\n\n${response.savingSteps.join('\n')}`;
      setPlan({ goalId: goal.id, text });
      await goalService.saveAIPlan(goal.id, response);
    } catch (planError) {
      console.error('Unable to create goal plan:', planError);
      setError('FlowMint could not create a plan right now. Your goal is unchanged.');
    } finally {
      setPlanningId(null);
    }
  };

  const deleteGoal = async (id: string) => {
    setError('');
    try {
      await goalService.delete(id);
      setGoals((current) => current.filter((goal) => goal.id !== id));
      if (plan?.goalId === id) setPlan(null);
    } catch (deleteError) {
      console.error('Unable to delete savings goal:', deleteError);
      setError('Your goal could not be deleted. Please try again.');
    }
  };

  return (
    <section className="space-y-6 pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Plan and save</p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: 'var(--text-color)' }}>Savings goals</h1>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-xl bg-brand p-3 text-black" aria-label="Add savings goal">
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2" style={{ borderColor: 'var(--glass-border)' }}>
          <input value={goalName} onChange={(event) => setGoalName(event.target.value)} required placeholder="What are you saving for?" aria-label="Goal name" className="rounded-xl bg-white/5 p-3" />
          <input type="number" min="0.01" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} required placeholder="Target amount (₹)" aria-label="Target amount" className="rounded-xl bg-white/5 p-3" />
          <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} aria-label="Target date" className="rounded-xl bg-white/5 p-3" />
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category (optional)" aria-label="Goal category" className="rounded-xl bg-white/5 p-3" />
          <button disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-brand p-3 font-black text-black disabled:opacity-60 sm:col-span-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save goal'}
          </button>
        </form>
      )}

      {error && <p role="alert" className="rounded-xl border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
      ) : goals.length === 0 ? (
        <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--glass-border)' }}>
          <Target className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-4 text-lg font-black" style={{ color: 'var(--text-color)' }}>No goals yet</h2>
          <p className="mt-2 text-sm text-gray-500">Add a goal to create a savings plan using the financial details you provided.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const target = Number(goal.target_amount);
            const current = Number(goal.current_amount);
            const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
            return (
              <article key={goal.id} className="rounded-2xl border p-5" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-black" style={{ color: 'var(--text-color)' }}>{goal.name}</h2>
                    <p className="mt-1 text-xs text-gray-500">{goal.category || 'Savings goal'}{goal.deadline ? ` · Target ${new Date(`${goal.deadline}T00:00:00`).toLocaleDateString()}` : ''}</p>
                  </div>
                  <button onClick={() => void deleteGoal(goal.id)} aria-label={`Delete ${goal.name}`} className="text-gray-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <span>{formatMoney(current)} saved</span>
                  <span>Target {formatMoney(target)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => void createPlan(goal)} disabled={planningId === goal.id} className="inline-flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-2 text-sm font-bold text-brand disabled:opacity-50">
                    {planningId === goal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create savings plan
                  </button>
                  <p className="self-center text-xs text-gray-500">Plan only—FlowMint will not move money.</p>
                </div>
                {plan?.goalId === goal.id && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm leading-relaxed">{plan.text}</p>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default FinancialGoals;
