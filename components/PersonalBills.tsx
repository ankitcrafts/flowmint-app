import { useEffect, useState, type FormEvent } from 'react';
import { Bell, Loader2, Plus } from 'lucide-react';
import { billService, type Bill } from '../services/apiService';

const formatMoney = (amount: number) => `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const PersonalBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('Bill');
  const [error, setError] = useState('');

  const loadBills = async () => {
    setError('');
    try {
      setBills(await billService.getAll());
    } catch (loadError) {
      console.error('Unable to load bills:', loadError);
      setError('Your bills could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadBills(); }, []);

  const createBill = async (event: FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !dueDate) {
      setError('Enter a bill name, a positive amount, and a due date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const bill = await billService.create({
        title: title.trim(),
        amount: numericAmount,
        due_date: dueDate,
        type: type.trim() || 'Bill',
      });
      setBills((current) => [...current, bill].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setTitle('');
      setAmount('');
      setDueDate('');
      setType('Bill');
      setShowForm(false);
    } catch (createError) {
      console.error('Unable to save bill:', createError);
      setError('Your bill could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const recordPaidOutsideApp = async (bill: Bill) => {
    setError('');
    try {
      const updated = await billService.markPaid(bill.id);
      setBills((current) => current.map((item) => item.id === bill.id ? updated : item));
    } catch (updateError) {
      console.error('Unable to update bill status:', updateError);
      setError('The bill status could not be updated. Please try again.');
    }
  };

  const unpaid = bills.filter((bill) => !bill.is_paid);
  const totalDue = unpaid.reduce((sum, bill) => sum + Number(bill.amount), 0);

  return (
    <section className="space-y-6 pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Keep track</p>
          <h1 className="mt-2 text-3xl font-black" style={{ color: 'var(--text-color)' }}>Bills</h1>
        </div>
        <button onClick={() => setShowForm((value) => !value)} aria-label="Add bill reminder" className="rounded-xl bg-brand p-3 text-black"><Plus className="h-5 w-5" /></button>
      </header>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--glass-border)' }}>
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Unpaid reminders</p>
        <p className="mt-2 text-2xl font-black" style={{ color: 'var(--text-color)' }}>{formatMoney(totalDue)}</p>
        <p className="mt-1 text-xs text-gray-500">A record of bills you entered; this is not a bank balance or payment.</p>
      </div>

      {showForm && (
        <form onSubmit={createBill} className="grid gap-3 rounded-2xl border p-5 sm:grid-cols-2" style={{ borderColor: 'var(--glass-border)' }}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Bill name" aria-label="Bill name" className="rounded-xl bg-white/5 p-3" />
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="Amount (₹)" aria-label="Bill amount" className="rounded-xl bg-white/5 p-3" />
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required aria-label="Due date" className="rounded-xl bg-white/5 p-3" />
          <input value={type} onChange={(event) => setType(event.target.value)} placeholder="Type (optional)" aria-label="Bill type" className="rounded-xl bg-white/5 p-3" />
          <button disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-brand p-3 font-black text-black disabled:opacity-60 sm:col-span-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save reminder'}
          </button>
        </form>
      )}

      {error && <p role="alert" className="rounded-xl border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}

      {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div> : bills.length === 0 ? (
        <div className="rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--glass-border)' }}>
          <Bell className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-4 text-lg font-black" style={{ color: 'var(--text-color)' }}>No bill reminders yet</h2>
          <p className="mt-2 text-sm text-gray-500">Add the bills you want to track. FlowMint only records reminders and does not pay them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <article key={bill.id} className="flex items-center justify-between gap-4 rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)' }}>
              <div>
                <h2 className="font-bold" style={{ color: 'var(--text-color)' }}>{bill.title}</h2>
                <p className="mt-1 text-xs text-gray-500">{bill.type} · Due {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-black" style={{ color: 'var(--text-color)' }}>{formatMoney(Number(bill.amount))}</p>
                {bill.is_paid ? <span className="text-xs text-brand">Recorded paid</span> : (
                  <button onClick={() => void recordPaidOutsideApp(bill)} className="mt-1 text-xs font-bold text-brand">
                    Record paid outside FlowMint
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default PersonalBills;
