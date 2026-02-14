
import React, { useState, useMemo } from 'react';
import {
  Sparkles, Smartphone, Plane, Bike, GraduationCap, Gem, Shirt, Camera,
  TrendingDown, Clock, ChevronRight, Plus, X, Heart, Zap, Target
} from 'lucide-react';

interface Wish {
  id: string;
  name: string;
  price: number;
  icon: string;
  monthsToAfford: number;
  savedSoFar: number;
  aiTip: string;
  speedUpTip: string;
  priority: 'high' | 'medium' | 'low';
}

const MOCK_WISHES: Wish[] = [
  {
    id: '1', name: 'iPhone 16 Pro', price: 134900, icon: 'phone',
    monthsToAfford: 5, savedSoFar: 42000,
    aiTip: 'At current savings rate of ₹18,500/month, you can afford this in 5 months.',
    speedUpTip: 'Reducing dining out by ₹1,200/month speeds this up by 1 month.',
    priority: 'high',
  },
  {
    id: '2', name: 'Goa Trip', price: 45000, icon: 'plane',
    monthsToAfford: 2, savedSoFar: 18000,
    aiTip: 'You\'re 40% there! At your pace, book by April.',
    speedUpTip: 'Skip 3 Swiggy orders this month = ₹1,500 saved toward this.',
    priority: 'medium',
  },
  {
    id: '3', name: 'Royal Enfield Classic 350', price: 195000, icon: 'bike',
    monthsToAfford: 9, savedSoFar: 25000,
    aiTip: 'This is a big goal. Consider a partial loan + savings combo.',
    speedUpTip: 'Redirecting your ₹5,000 SIP for 3 months cuts timeline by 3 months.',
    priority: 'low',
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  phone: <Smartphone className="w-6 h-6 text-blue-400" />,
  plane: <Plane className="w-6 h-6 text-cyan-400" />,
  bike: <Bike className="w-6 h-6 text-red-400" />,
  education: <GraduationCap className="w-6 h-6 text-yellow-400" />,
  luxury: <Gem className="w-6 h-6 text-purple-400" />,
  fashion: <Shirt className="w-6 h-6 text-pink-400" />,
  camera: <Camera className="w-6 h-6 text-orange-400" />,
};

const AIWishTracker: React.FC = () => {
  const [wishes, setWishes] = useState<Wish[]>(MOCK_WISHES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const totalWishValue = useMemo(() => wishes.reduce((s, w) => s + w.price, 0), [wishes]);
  const totalSaved = useMemo(() => wishes.reduce((s, w) => s + w.savedSoFar, 0), [wishes]);

  const handleAdd = () => {
    if (!newName || !newPrice) return;
    const price = parseInt(newPrice);
    const months = Math.ceil(price / 18500);
    const wish: Wish = {
      id: Date.now().toString(),
      name: newName,
      price,
      icon: 'luxury',
      monthsToAfford: months,
      savedSoFar: 0,
      aiTip: `At ₹18,500/month savings, you can afford this in ~${months} months.`,
      speedUpTip: 'Cut discretionary spending by 15% to speed up.',
      priority: price > 100000 ? 'low' : price > 40000 ? 'medium' : 'high',
    };
    setWishes([wish, ...wishes]);
    setNewName('');
    setNewPrice('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>Wish Tracker</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
            <span className="text-brand">AI-powered</span> • Turn wants into plans
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 bg-brand rounded-2xl text-black flex items-center justify-center shadow-lg"
          style={{ boxShadow: '0 8px 20px var(--brand-glow)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Psychology Banner */}
      <div className="glass rounded-[2rem] p-6 border bg-gradient-to-r from-brand/5 to-purple-500/5 theme-transition"
        style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--brand-glow)' }}>
            <Heart className="w-6 h-6 text-brand" />
          </div>
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest">Mindful Spending</p>
            <p className="text-xs text-gray-400 mt-1">"Every wish is a plan waiting to happen."</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-[2rem] p-5 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Wishlist</p>
          <h3 className="text-xl font-black mt-2 tracking-tighter" style={{ color: 'var(--text-color)' }}>
            ₹{totalWishValue.toLocaleString()}
          </h3>
          <p className="text-[9px] font-black text-gray-500 mt-1 uppercase">{wishes.length} items</p>
        </div>
        <div className="glass rounded-[2rem] p-5 border theme-transition" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Progress</p>
          <h3 className="text-xl font-black mt-2 tracking-tighter text-brand">
            ₹{totalSaved.toLocaleString()}
          </h3>
          <p className="text-[9px] font-black text-brand mt-1 uppercase">{Math.round((totalSaved / totalWishValue) * 100)}% saved</p>
        </div>
      </div>

      {/* Wish Cards */}
      <div className="space-y-4">
        {wishes.map((wish) => {
          const progress = Math.round((wish.savedSoFar / wish.price) * 100);
          const isExpanded = expandedId === wish.id;
          return (
            <div key={wish.id}
              className="glass rounded-[2rem] border overflow-hidden transition-all theme-transition"
              style={{ borderColor: isExpanded ? 'var(--brand-primary)' : 'var(--glass-border)' }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : wish.id)}
                className="w-full p-6 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--card-subtle)' }}>
                      {ICON_MAP[wish.icon] || <Gem className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm tracking-tight" style={{ color: 'var(--text-color)' }}>{wish.name}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">₹{wish.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-black" style={{ color: 'var(--text-color)' }}>{wish.monthsToAfford}mo</span>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${wish.priority === 'high' ? 'bg-brand/10 text-brand' : wish.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {wish.priority}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                    <span>{progress}% saved</span>
                    <span style={{ color: 'var(--text-color)' }}>₹{wish.savedSoFar.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-border)' }}>
                    <div className="h-full bg-brand rounded-full transition-all duration-700 shadow-[0_0_10px_var(--brand-glow)]"
                      style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </button>

              {/* Expanded AI Section */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="h-px" style={{ backgroundColor: 'var(--glass-border)' }}></div>

                  {/* AI Prediction */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-glow)' }}>
                      <Sparkles className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1">AI Says</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-color)' }}>{wish.aiTip}</p>
                    </div>
                  </div>

                  {/* Speed Up Tip */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10 shrink-0">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Speed Up</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-color)' }}>{wish.speedUpTip}</p>
                    </div>
                  </div>

                  <button className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all theme-transition"
                    style={{ color: 'var(--text-color)', backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)' }}>
                    Add Funds to This Wish
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-t-[2.5rem] p-8 space-y-6 animate-in slide-in-from-bottom-8 duration-300"
            style={{ backgroundColor: 'var(--bg-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tight" style={{ color: 'var(--text-color)' }}>Add a Wish</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--card-subtle)' }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              placeholder="What do you wish for?"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-16 px-6 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
            />
            <input
              placeholder="Estimated cost (₹)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ''))}
              type="tel"
              className="w-full h-16 px-6 rounded-2xl text-sm font-bold focus:outline-none border-2 theme-transition"
              style={{ backgroundColor: 'var(--card-subtle)', borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
            />
            {newPrice && (
              <div className="flex items-center gap-2 px-2">
                <Sparkles className="w-3 h-3 text-brand" />
                <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                  ~{Math.ceil(parseInt(newPrice || '0') / 18500)} months at your savings rate
                </span>
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={!newName || !newPrice}
              className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${!newName || !newPrice ? 'opacity-30' : ''}`}
              style={{ backgroundColor: 'var(--brand-primary)', color: '#000', boxShadow: '0 10px 30px var(--brand-glow)' }}
            >
              Add to Wishlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWishTracker;
