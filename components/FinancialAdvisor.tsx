import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Loader2, MessageCircle, Send } from 'lucide-react';
import { llmService } from '../services/llmService';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

const FinancialAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Ask FlowMint about budgeting, saving, or a financial decision. Advice is based on the financial details you provided.' },
  ]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const question = message.trim();
    if (!question || loading) return;

    setMessages((current) => [...current, { role: 'user', text: question }]);
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await llmService.chatWithAI(question);
      setMessages((current) => [...current, {
        role: 'assistant',
        text: response.followUp ? `${response.reply}\n\n${response.followUp}` : response.reply,
      }]);
    } catch (requestError) {
      console.error('FlowMint AI request failed:', requestError);
      setError('FlowMint AI is unavailable right now. Your question was not answered; please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col gap-5 pb-24 md:pb-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">Your AI Financial Copilot</p>
        <h1 className="mt-2 text-3xl font-black" style={{ color: 'var(--text-color)' }}>Ask FlowMint</h1>
        <p className="mt-2 text-sm text-gray-500">Planning guidance based on your saved financial profile. No money is moved by this app.</p>
      </header>

      <div className="flex-1 space-y-4" aria-live="polite">
        {messages.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {item.role === 'assistant' && <Bot className="mt-2 h-5 w-5 shrink-0 text-brand" />}
            <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl border p-4 text-sm leading-relaxed"
              style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)', color: 'var(--text-color)' }}>
              {item.text}
            </p>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Checking your question…</div>}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-500/30 p-3 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}>
        <MessageCircle className="ml-2 h-5 w-5 shrink-0 text-gray-500" />
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Can I afford a ₹80,000 purchase?"
          aria-label="Ask FlowMint"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-color)' }}
        />
        <button type="submit" disabled={loading || !message.trim()} aria-label="Send question" className="rounded-xl bg-brand p-3 text-black disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="text-xs text-gray-500">AI responses are estimates for planning, not financial guarantees or professional advice.</p>
    </section>
  );
};

export default FinancialAdvisor;
