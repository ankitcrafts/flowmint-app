
import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Zap, Shield, TrendingUp, TrendingDown, AlertTriangle,
  Heart, Target, Calculator, CreditCard, ChevronRight, Brain,
  MessageSquare, Send, Bot, User, Lightbulb, Loader2
} from 'lucide-react';
import { llmService } from '../services/llmService';

interface InsightCard {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
  action?: string;
}

const AI_INSIGHTS: InsightCard[] = [
  {
    id: '1', category: 'Goal Acceleration', icon: <Target className="w-5 h-5 text-brand" />,
    title: 'Tokyo Trip Speed Boost',
    message: 'Your Swiggy spending averages ₹4,200/month. Reducing it by 30% saves ₹1,260/month → Tokyo Trip reached 2 months faster.',
    severity: 'success', action: 'View Plan',
  },
  {
    id: '2', category: 'EMI Stress Alert', icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
    title: 'EMI Load Approaching Threshold',
    message: 'Your EMI-to-income ratio is 36%. If you take a new ₹1L personal loan, it jumps to 48%. Consider waiting 3 months for the iPhone 15 EMI to close.',
    severity: 'warning', action: 'Simulate Loan',
  },
  {
    id: '3', category: 'Credit Health', icon: <Shield className="w-5 h-5 text-brand" />,
    title: 'Score Momentum',
    message: 'Your credit score improved +12 points this month. Maintaining on-time payments for 3 more months could push you above 800 — unlocking premium loan rates.',
    severity: 'success', action: 'Check Score',
  },
  {
    id: '4', category: 'Loan Readiness', icon: <Calculator className="w-5 h-5 text-blue-400" />,
    title: 'Pre-Approved Window Open',
    message: 'Based on your credit score (782) and steady income, you qualify for pre-approved personal loans up to ₹5L at 9.25%. Best rates available now.',
    severity: 'info', action: 'Explore Loans',
  },
  {
    id: '5', category: 'Spending Psychology', icon: <Brain className="w-5 h-5 text-amber-500" />,
    title: 'Weekend Spending Pattern',
    message: 'You spend 2.3x more on weekends (avg ₹3,800) compared to weekdays (₹1,600). Setting a weekend budget of ₹2,500 could save ₹5,200/month.',
    severity: 'warning', action: 'Set Budget',
  },
  {
    id: '6', category: 'Wish Tracker', icon: <Heart className="w-5 h-5 text-pink-400" />,
    title: 'Royal Enfield – Combo Strategy',
    message: 'Instead of saving ₹1.95L fully, consider a 50% down payment (₹97,500 in ~5 months) + a bike loan at 8.5% for the rest. Your readiness score supports this.',
    severity: 'info', action: 'View Strategy',
  },
];

const CHAT_MESSAGES = [
  { role: 'bot' as const, text: 'Hey! I\'m your FlowMint AI advisor. Ask me anything about your finances — savings, loans, credit, spending, tax, or investments. I\'m powered by real AI! 🤖✨' },
];

const AIInsights: React.FC = () => {
  const [view, setView] = useState<'insights' | 'chat'>('insights');
  const [chatMessages, setChatMessages] = useState<{role: 'bot' | 'user'; text: string}[]>(CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = { role: 'user' as const, text: inputText };
    setChatMessages(prev => [...prev, userMsg]);
    const currentMessage = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const response = await llmService.chatWithAI(currentMessage);
      
      let replyText = response.reply;
      if (response.followUp) {
        replyText += `\n\n💡 ${response.followUp}`;
      }

      if (response.fallback) {
        replyText += '\n\n🔄 (AI is busy — this is a cached tip. Try again!)';
      }

      setChatMessages(prev => [...prev, { role: 'bot' as const, text: replyText }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'bot' as const,
        text: "Oops, something went wrong! But here's a quick tip: start a ₹500/month SIP today — your future self will thank you. Try asking again! 💪",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const severityStyles: Record<string, { border: string; bg: string }> = {
    info: { border: 'var(--glass-border)', bg: 'transparent' },
    warning: { border: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.02)' },
    success: { border: 'rgba(0, 255, 163, 0.2)', bg: 'rgba(0, 255, 163, 0.02)' },
    critical: { border: 'rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.02)' },
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>AI Advisor</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
            <span className="text-brand">Powered by Intelligence</span> • Advisory only
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-glow)' }}>
          <Sparkles className="w-6 h-6 text-brand" />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
        <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0" />
        <p className="text-[9px] text-gray-500 font-bold">AI insights are advisory. No financial guarantees. Always consult a certified financial advisor for major decisions.</p>
      </div>

      {/* View Toggle */}
      <div className="flex p-1 rounded-2xl gap-1 theme-transition" style={{ backgroundColor: 'var(--card-subtle)' }}>
        <button
          onClick={() => setView('insights')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'insights' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
        >
          Smart Insights
        </button>
        <button
          onClick={() => setView('chat')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'chat' ? 'bg-brand text-black shadow-lg' : 'text-gray-500'}`}
        >
          AI Chat
        </button>
      </div>

      {view === 'insights' ? (
        <div className="space-y-4">
          {AI_INSIGHTS.map((insight) => {
            const styles = severityStyles[insight.severity];
            return (
              <div key={insight.id}
                className="glass rounded-[2rem] p-6 border theme-transition hover:translate-x-1 transition-all"
                style={{ borderColor: styles.border, backgroundColor: styles.bg }}>
                <div className="flex items-center gap-2 mb-3">
                  {insight.icon}
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">{insight.category}</span>
                </div>
                <h4 className="font-black text-sm tracking-tight mb-2" style={{ color: 'var(--text-color)' }}>{insight.title}</h4>
                <p className="text-xs leading-relaxed text-gray-400 mb-4">{insight.message}</p>
                {insight.action && (
                  <button className="flex items-center gap-2 text-brand text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform">
                    {insight.action} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chat Messages */}
          <div className="space-y-3 min-h-[300px] max-h-[55vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-brand/10' : ''}`}
                  style={{ backgroundColor: msg.role === 'user' ? 'var(--card-subtle)' : undefined }}>
                  {msg.role === 'bot' ? <Bot className="w-4 h-4 text-brand" /> : <User className="w-4 h-4 text-gray-400" />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'bot' ? 'glass border' : ''}`}
                  style={{
                    borderColor: msg.role === 'bot' ? 'var(--glass-border)' : undefined,
                    backgroundColor: msg.role === 'user' ? 'var(--brand-primary)' : undefined,
                    color: msg.role === 'user' ? '#000' : 'var(--text-color)',
                  }}>
                  <p className="text-xs leading-relaxed font-medium whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-brand/10">
                  <Bot className="w-4 h-4 text-brand" />
                </div>
                <div className="max-w-[80%] p-4 rounded-2xl glass border" style={{ borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand animate-spin" />
                    <span className="text-xs text-gray-400 font-medium">FlowMint AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {/* Scroll anchor */}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex gap-3 items-center">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLoading ? 'AI is thinking...' : 'Ask about loans, savings, credit, tax...'}
              disabled={isLoading}
              className="flex-1 h-14 px-5 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center text-black shadow-lg shrink-0 disabled:opacity-50 transition-opacity"
              style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
