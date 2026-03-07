
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  User, 
  Briefcase, 
  GraduationCap, 
  Rocket, 
  Palette,
  Terminal,
  HeartPulse,
  ShoppingBag,
  Coins,
  PartyPopper,
  Calendar,
  CreditCard,
  Landmark,
  Plus,
  ChevronLeft,
  Loader2,
  Navigation,
  Fingerprint,
  ShieldCheck,
  IdCard,
  FileCheck,
  AlertCircle
} from 'lucide-react';

import { supabase } from '../services/supabase';
import { generateBiometricKey, encryptDeviceData, decryptDeviceData, EncryptedPayload } from '../utils/crypto';

// --- Verhoeff Algorithm Implementation ---
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

const validateAadhaar = (aadhaar: string) => {
  const digits = aadhaar.replace(/\s/g, '');
  if (digits.length !== 12 || !/^\d+$/.test(digits)) return false;
  let c = 0;
  const invertedArray = digits.split('').map(Number).reverse();
  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[i % 8][invertedArray[i]]];
  }
  return c === 0;
};

const validatePAN = (pan: string) => {
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!regex.test(pan)) return { valid: false, message: 'Invalid Format (AAAAA0000A)' };
  if (pan[3] !== 'P') return { valid: false, message: 'Only Individual PAN allowed' };
  return { valid: true };
};

// --- Component Logic ---

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  verified?: boolean;
}

interface InitialSetupProps {
  onComplete: (profile?: UserProfile) => void;
  theme: 'light' | 'dark';
}

type SetupStep = 'name' | 'city' | 'vibe' | 'field' | 'income' | 'savings' | 'identity-choice' | 'details-review' | 'ekyc' | 'card-details' | 'celebration';

const FIELD_OPTIONS: Record<string, { label: string, icon: React.ReactNode }[]> = {
  Student: [
    { label: 'Tech', icon: <Terminal className="w-4 h-4" /> },
    { label: 'Arts', icon: <Palette className="w-4 h-4" /> },
    { label: 'Medicine', icon: <HeartPulse className="w-4 h-4" /> },
    { label: 'Commerce', icon: <Coins className="w-4 h-4" /> },
    { label: 'Other', icon: <User className="w-4 h-4" /> }
  ],
  Working: [
    { label: 'Tech', icon: <Terminal className="w-4 h-4" /> },
    { label: 'Finance', icon: <Landmark className="w-4 h-4" /> },
    { label: 'Creative', icon: <Palette className="w-4 h-4" /> },
    { label: 'Healthcare', icon: <HeartPulse className="w-4 h-4" /> },
    { label: 'Corp Ops', icon: <Briefcase className="w-4 h-4" /> }
  ],
  Freelancer: [
    { label: 'Design', icon: <Palette className="w-4 h-4" /> },
    { label: 'Dev', icon: <Terminal className="w-4 h-4" /> },
    { label: 'Writing', icon: <Palette className="w-4 h-4" /> },
    { label: 'Marketing', icon: <Rocket className="w-4 h-4" /> },
    { label: 'Consulting', icon: <Briefcase className="w-4 h-4" /> }
  ],
  Business: [
    { label: 'Startup', icon: <Rocket className="w-4 h-4" /> },
    { label: 'Retail', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Services', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'E-com', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Legacy', icon: <Landmark className="w-4 h-4" /> }
  ]
};

const InitialSetup: React.FC<InitialSetupProps> = ({ onComplete, theme }) => {
  const [step, setStep] = useState<SetupStep>('name');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [city, setCity] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [vibe, setVibe] = useState('');
  const [field, setField] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [savingsGoal, setSavingsGoal] = useState(15000);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Verification state
  const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idError, setIdError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEkycComplete, setIsEkycComplete] = useState(false);
  const [fetchedDetails, setFetchedDetails] = useState({
    dob: '12th Aug 1998',
    address: 'Indiranagar, Bengaluru, KA',
    fullAddress: 'No. 42, 10th Main Road, Stage 2, Indiranagar, Bengaluru - 560038'
  });

  // Local Biometric Crypto Vault State
  const [encryptedVault, setEncryptedVault] = useState<EncryptedPayload | null>(null);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [decryptedData, setDecryptedData] = useState<string>('');

  // Card details state
  const [cardType, setCardType] = useState<'credit' | 'debit'>('debit');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardError, setCardError] = useState('');
  const [isCardSaving, setIsCardSaving] = useState(false);

  // Assistant typing logic
  useEffect(() => {
    let text = "";
    switch (step) {
      case 'name': text = "Hey there! I'm Flowy. What should I call you?"; break;
      case 'city': text = `Nice to meet you, ${name}! Where are you based?`; break;
      case 'vibe': text = `To build your flow, I need to know your current path:`; break;
      case 'field': text = `Which industry are you focused on?`; break;
      case 'income': text = vibe === 'Student' ? "How much pocket money do you get every month?" : "How much do you bring in every month (after tax)?"; break;
      case 'savings': text = `Based on your ₹${monthlyIncome.toLocaleString()} ${vibe === 'Student' ? 'budget' : 'income'}, how much do you plan to save?`; break;
      case 'identity-choice': text = "Let's verify your identity to unlock higher limits."; break;
      case 'details-review': text = "Details fetched! Everything looking sharp?"; break;
      case 'ekyc': text = "Lock your identity securely on-device with FlowMint Local Biometrics."; break;
      case 'card-details': text = `Link a card to unlock full dashboard insights.`; break;
      case 'celebration': text = "You're all set, Alpha. Ready to enter the flow?"; break;
    }
    
    setDisplayText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [step, name, vibe, monthlyIncome]);

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Name cannot be empty"); return false; }
    if (!/^[A-Za-z\s]+$/.test(trimmed)) { setNameError("Letters only, please"); return false; }
    setNameError(''); return true;
  };

  const detectLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          const cityName = data.address.city || data.address.town || data.address.village || data.address.state || "Remote";
          setCity(cityName);
        } catch (err) {
          console.error("Reverse geocoding failed", err);
          setLocationError("Unable to identify city. Please type manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permission denied. Please enable location or type manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get user location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred.");
            break;
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleIdChange = (val: string) => {
    setIdError('');
    if (idType === 'aadhaar') {
      const numeric = val.replace(/\D/g, '').slice(0, 12);
      const formatted = numeric.match(/.{1,4}/g)?.join(' ') || numeric;
      setIdNumber(formatted);
    } else {
      setIdNumber(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
    }
  };

  const handleIdSubmit = () => {
    if (idType === 'aadhaar') {
      if (!validateAadhaar(idNumber)) {
        setIdError('Invalid Aadhaar Checksum');
        return;
      }
    } else {
      const panVal = validatePAN(idNumber);
      if (!panVal.valid) {
        setIdError(panVal.message || 'Invalid PAN');
        return;
      }
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep('details-review');
    }, 1500);
  };

  const startEkyc = async () => {
    setIsVerifying(true);
    
    try {
      // 1. Simulate the biometric scan delay securely
      await new Promise(r => setTimeout(r, 1200));

      // 2. Generate a highly secure local Biometric Key mimicking native Secure Enclaves
      const key = await generateBiometricKey();

      // 3. Prepare the Sensitive Payload
      const sensitivePayload = JSON.stringify({
        idType,
        idNumber,
        ...fetchedDetails
      });

      // 4. Encrypt the payload natively with AES-GCM
      const encrypted = await encryptDeviceData(sensitivePayload, key);

      // 5. Save the encrypted vault & the key locally
      setEncryptedVault(encrypted);
      setVaultKey(key);
      
      setIsEkycComplete(true);
    } catch (err) {
      console.error("Local BioCrypt Failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const testDecryption = async () => {
    setIsVerifying(true);
    try {
      // Re-trigger biometric scan to authorize decryption
      await new Promise(r => setTimeout(r, 1000));
      
      if (encryptedVault && vaultKey) {
        const decrypted = await decryptDeviceData(encryptedVault, vaultKey);
        setDecryptedData(decrypted);
      }
    } catch (err) {
      console.error("Decryption Failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Card helpers
  const handleCardNumberChange = (val: string) => {
    setCardError('');
    const numeric = val.replace(/\D/g, '').slice(0, 16);
    const formatted = numeric.match(/.{1,4}/g)?.join(' ') || numeric;
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (val: string) => {
    setCardError('');
    const numeric = val.replace(/\D/g, '').slice(0, 4);
    if (numeric.length >= 3) {
      setCardExpiry(`${numeric.slice(0, 2)}/${numeric.slice(2)}`);
    } else {
      setCardExpiry(numeric);
    }
  };

  const handleCardSubmit = () => {
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 12) { setCardError('Card number too short'); return; }
    if (!cardExpiry || cardExpiry.length < 4) { setCardError('Enter a valid expiry (MM/YY)'); return; }
    const month = parseInt(cardExpiry.slice(0, 2));
    if (month < 1 || month > 12) { setCardError('Invalid expiry month'); return; }
    if (cardCvv.length < 3) { setCardError('Enter a valid CVV'); return; }
    if (!cardName.trim()) { setCardError('Enter cardholder name'); return; }

    setIsCardSaving(true);
    setTimeout(() => {
      setIsCardSaving(false);
      setStep('celebration');
    }, 1500);
  };

  const handleCompleteSetup = async () => {
    const profileData = {
      name: name || 'User',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'default'}`,
      verified: isEkycComplete,
      email: 'user@flowmint.com',
    };

    // TODO: Save profile to backend when user session is available
    // For now, just proceed with local profile data

    onComplete(profileData);
  };

  const handleIncomeChange = (val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0;
    setMonthlyIncome(Math.min(10000000, num));
    if (savingsGoal > num) setSavingsGoal(num);
  };

  const handleSavingsChange = (val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0;
    const actualNum = Math.min(monthlyIncome, num);
    setSavingsGoal(actualNum);
  };

  const growthThreshold = monthlyIncome * 0.40;
  const eliteThreshold = monthlyIncome * 0.70;

  const getSavingsLevel = () => {
    if (savingsGoal < growthThreshold) return 'steady';
    if (savingsGoal < eliteThreshold) return 'growth';
    return 'elite';
  };

  const savingsLevel = getSavingsLevel();

  return (
    <div className="h-screen w-full flex flex-col theme-transition relative overflow-hidden" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Dynamic Background Glow */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-all duration-1000"
        style={{ 
          backgroundColor: savingsGoal > eliteThreshold ? 'var(--brand-primary)' : 'var(--brand-glow)',
          opacity: 0.15
        }}
      ></div>

      <div className="flex-1 flex flex-col px-8 pt-10 relative z-10 overflow-hidden pb-10">
        <div className="mb-6 shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/20 animate-bounce">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <div className="px-3 py-1 bg-brand/10 rounded-lg">
              <span className="text-[10px] font-black uppercase text-brand tracking-widest">Flowy AI</span>
            </div>
          </div>
          
          <div className="min-h-[70px]">
             <h2 className="text-xl font-black tracking-tighter leading-tight" style={{ color: 'var(--text-color)' }}>
               {displayText}
               {isTyping && <span className="inline-block w-1 h-5 bg-brand ml-1 animate-pulse" />}
             </h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
          {step === 'name' && (
            <div className="space-y-8">
              <input 
                type="text"
                placeholder="Type your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={`w-full bg-transparent border-b-2 py-4 text-3xl font-black focus:outline-none transition-all placeholder:text-gray-700 ${nameError ? 'border-red-500' : 'border-brand/20 focus:border-brand'}`}
                style={{ color: 'var(--text-color)' }}
              />
              <PremiumButton disabled={!name} onClick={() => validateName() && setStep('city')} label="CONTINUE" />
            </div>
          )}

          {step === 'city' && (
            <div className="space-y-6">
              <div className="relative pt-4">
                <input 
                  type="text"
                  placeholder="City name"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (locationError) setLocationError('');
                  }}
                  className="w-full bg-transparent border-b-[0.5px] border-white/60 py-4 text-3xl font-black focus:outline-none focus:border-brand transition-all placeholder:text-gray-500"
                  style={{ color: 'var(--text-color)' }}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={detectLocation}
                  disabled={isLocating}
                  className="w-full py-4 glass border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand transition-all active:scale-95"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {isLocating ? "LOCATING..." : "LOCATE AUTOMATICALLY"}
                </button>
                {locationError && (
                  <div className="flex items-center gap-2 px-2 text-red-500 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{locationError}</span>
                  </div>
                )}
              </div>

              <PremiumButton disabled={!city} onClick={() => setStep('vibe')} label="CONTINUE" />
            </div>
          )}

          {step === 'vibe' && (
            <div className="grid grid-cols-2 gap-3">
              <VibeCard icon={<GraduationCap />} label="Student" onClick={() => { setVibe('Student'); setStep('field'); }} />
              <VibeCard icon={<Briefcase />} label="Working" onClick={() => { setVibe('Working'); setStep('field'); }} />
              <VibeCard icon={<Palette />} label="Freelancer" onClick={() => { setVibe('Freelancer'); setStep('field'); }} />
              <VibeCard icon={<Rocket />} label="Business" onClick={() => { setVibe('Business'); setStep('field'); }} />
            </div>
          )}

          {step === 'field' && (
            <div className="grid grid-cols-2 gap-3">
              {FIELD_OPTIONS[vibe]?.map((opt) => (
                <button 
                  key={opt.label}
                  onClick={() => { setField(opt.label); setStep('income'); }}
                  className="p-4 glass border border-white/5 rounded-[1.5rem] flex flex-col items-center gap-3 group hover:border-brand/50 hover:bg-brand/5 transition-all active:scale-95"
                >
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-brand transition-colors">
                    {opt.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'var(--text-color)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 'income' && (
            <div className="space-y-6">
               <div className="text-center py-2 flex flex-col items-center">
                 <span className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">
                   {vibe === 'Student' ? 'MONTHLY POCKET MONEY' : 'MONTHLY INCOME'}
                 </span>
                 <div className="flex items-center justify-center gap-3 mt-4 group w-full">
                    <span className="text-4xl font-black opacity-30">₹</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={monthlyIncome.toLocaleString()}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                      className="text-6xl font-black tracking-tighter bg-transparent border-none outline-none text-center w-full min-w-0"
                      style={{ color: 'var(--text-color)' }}
                    />
                 </div>
               </div>
               
               <div className="px-2 pt-4">
                <input 
                  type="range" 
                  min="5000" max="1000000" step="5000" 
                  value={Math.min(1000000, monthlyIncome)} 
                  onChange={(e) => setMonthlyIncome(parseInt(e.target.value))} 
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-premium" 
                  style={{ accentColor: 'var(--brand-primary)' }} 
                />
                <div className="flex justify-between items-center mt-6 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                  <span>₹5K</span>
                  <span>₹1M</span>
                </div>
               </div>
               
               <PremiumButton onClick={() => setStep('savings')} label="NEXT" />
            </div>
          )}

          {step === 'savings' && (
            <div className="space-y-6">
              <div className="text-center py-2 flex flex-col items-center">
                 <span className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">MONTHLY SAVINGS GOAL</span>
                 <div className="flex items-center justify-center gap-3 mt-4 group w-full">
                    <span className="text-4xl font-black opacity-30">₹</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={savingsGoal.toLocaleString()}
                      onChange={(e) => handleSavingsChange(e.target.value)}
                      className="text-6xl font-black tracking-tighter bg-transparent border-none outline-none text-center w-full min-w-0"
                      style={{ color: 'var(--text-color)' }}
                    />
                 </div>
              </div>
              
              <div className="px-2 pt-4">
                <input 
                  type="range" 
                  min="1000" max={monthlyIncome} step="500" 
                  value={savingsGoal} 
                  onChange={(e) => setSavingsGoal(parseInt(e.target.value))} 
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-premium" 
                  style={{ accentColor: 'var(--brand-primary)' }} 
                />
                <div className="flex justify-between items-center mt-6 text-[9px] font-black uppercase tracking-widest">
                   <span className={`transition-all duration-500 ${savingsLevel === 'steady' ? 'text-brand drop-shadow-[0_0_8px_var(--brand-glow)] scale-110' : 'text-gray-600'}`}>STEADY</span>
                   <span className={`transition-all duration-500 ${savingsLevel === 'growth' ? 'text-brand drop-shadow-[0_0_8px_var(--brand-glow)] scale-110' : 'text-gray-600'}`}>GROWTH PATH</span>
                   <span className={`transition-all duration-500 ${savingsLevel === 'elite' ? 'text-brand drop-shadow-[0_0_8px_var(--brand-glow)] scale-110' : 'text-gray-600'}`}>ELITE HUSTLE</span>
                </div>
              </div>
              
              <PremiumButton onClick={() => setStep('identity-choice')} label="SET GOAL" showSparkles />
            </div>
          )}

          {step === 'identity-choice' && (
            <div className="space-y-6">
              <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                <button 
                  onClick={() => { setIdType('aadhaar'); setIdNumber(''); setIdError(''); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${idType === 'aadhaar' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-gray-500'}`}
                >
                  Aadhaar
                </button>
                <button 
                  onClick={() => { setIdType('pan'); setIdNumber(''); setIdError(''); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${idType === 'pan' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-gray-500'}`}
                >
                  PAN Card
                </button>
              </div>

              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                <input 
                  type="text"
                  placeholder={idType === 'aadhaar' ? "0000 0000 0000" : "ABCDE 1234 F"}
                  value={idNumber}
                  onChange={(e) => handleIdChange(e.target.value)}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-12 py-5 text-xl font-black tracking-widest focus:outline-none focus:border-brand/50 transition-all"
                  style={{ 
                    color: 'var(--text-color)',
                    borderColor: idError ? '#EF4444' : 'var(--glass-border)'
                  }}
                />
              </div>

              {idError && (
                <div className="flex items-center gap-2 px-2 text-red-500 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{idError}</span>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <PremiumButton 
                  disabled={isVerifying || !idNumber} 
                  onClick={handleIdSubmit} 
                  label={isVerifying ? "FETCHING..." : "FETCH DETAILS"} 
                />
                <button onClick={() => setStep('ekyc')} className="w-full text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] py-2">Skip for now</button>
              </div>
            </div>
          )}

          {step === 'details-review' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
               <div className="glass border border-brand/30 rounded-[2.5rem] p-6 space-y-4 relative overflow-hidden shadow-[0_0_40px_var(--brand-glow)]">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center text-brand">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[8px] bg-brand text-black px-3 py-1 rounded-full font-black uppercase tracking-widest">Verified Data</span>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Birthday</p>
                      <p className="text-xl font-black" style={{ color: 'var(--text-color)' }}>{fetchedDetails.dob}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Registered Address</p>
                      <p className="text-sm font-bold text-gray-300 leading-tight">{fetchedDetails.fullAddress}</p>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl pointer-events-none rounded-full"></div>
               </div>
               <PremiumButton onClick={() => setStep('ekyc')} label="CONFIRM DETAILS" />
            </div>
          )}

          {step === 'ekyc' && (
            <div className="space-y-8 flex flex-col items-center py-6 w-full">
              <div className="relative cursor-pointer" onClick={isEkycComplete ? undefined : startEkyc}>
                <div className={`absolute inset-0 bg-brand/20 rounded-full animate-ping ${isVerifying ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`w-32 h-32 rounded-full border-4 border-dashed border-brand/30 flex items-center justify-center transition-all duration-500 ${isVerifying ? 'rotate-[360deg] border-brand' : ''}`}>
                  <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center text-brand shadow-[0_0_30px_var(--brand-glow)]">
                    {isEkycComplete ? <ShieldCheck className="w-12 h-12" /> : <Fingerprint className="w-12 h-12" />}
                  </div>
                </div>
                {isVerifying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-brand shadow-[0_0_15px_var(--brand-glow)] animate-bounce opacity-50"></div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'var(--text-color)' }}>{isEkycComplete ? 'Identity Secured' : 'Local Identity Vault'}</h3>
                {!isEkycComplete && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 leading-none">CRYPTOGRAPHICALLY SECURED ON DEVICE</p>}
              </div>

              {isEkycComplete && encryptedVault && (
                <div className="w-full glass border border-brand/20 rounded-[1.5rem] p-5 text-left animate-in fade-in slide-in-from-bottom-2 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-1">
                       <ShieldCheck className="w-3 h-3" /> Encrypted Vault Payload
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono break-all leading-tight bg-black/40 p-3 rounded-xl border border-white/5">
                    {encryptedVault.ciphertext.substring(0, 110)}...
                  </p>
                  
                  {decryptedData ? (
                    <div className="mt-4 pt-4 border-t border-brand/20 animate-in fade-in relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-2xl pointer-events-none rounded-full"></div>
                      <span className="text-[9px] font-black text-brand uppercase tracking-widest mb-2 block">Decrypted Payload</span>
                      <pre className="text-[10px] text-brand/90 font-mono mt-1 overflow-x-auto bg-brand/5 p-3 rounded-xl border border-brand/10">
                        {JSON.stringify(JSON.parse(decryptedData), null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <button 
                      onClick={testDecryption}
                      disabled={isVerifying}
                      className="mt-4 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 transition-all w-full flex items-center justify-center gap-2 group active:scale-95"
                    >
                      {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      {isVerifying ? "UNLOCKING VAULT..." : "RE-VERIFY & DECRYPT DATA"}
                    </button>
                  )}
                </div>
              )}

              <div className="w-full space-y-4 pt-2">
                {!isEkycComplete ? (
                    <PremiumButton disabled={isVerifying} onClick={startEkyc} label={isVerifying ? "ENCRYPTING..." : "SECURE NOW"} />
                ) : (
                    <PremiumButton onClick={() => setStep('card-details')} label="CONTINUE TO DASHBOARD" showSparkles />
                )}
                
                {!isEkycComplete && (
                  <button 
                    onClick={() => setStep('card-details')} 
                    disabled={isVerifying}
                    className="w-full text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] py-2 disabled:opacity-50 transition-opacity"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'card-details' && (
            <div className="space-y-6">
              {/* Card Type Toggle */}
              <div className="flex p-1 bg-white/5 rounded-2xl gap-1">
                <button 
                  onClick={() => { setCardType('debit'); setCardError(''); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cardType === 'debit' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-gray-500'}`}
                >
                  Debit Card
                </button>
                <button 
                  onClick={() => { setCardType('credit'); setCardError(''); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${cardType === 'credit' ? 'bg-brand text-black shadow-lg shadow-brand/20' : 'text-gray-500'}`}
                >
                  Credit Card
                </button>
              </div>

              {/* Card Visual */}
              <div className="relative glass border border-white/10 rounded-[1.5rem] p-6 space-y-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl pointer-events-none rounded-full"></div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-brand" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      {cardType === 'credit' ? 'Credit Card' : 'Debit Card'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-3"></div>
                  </div>
                </div>

                {/* Card Number */}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  className="w-full bg-transparent text-2xl font-black tracking-[0.15em] focus:outline-none placeholder:text-gray-700"
                  style={{ color: 'var(--text-color)' }}
                />

                {/* Expiry + CVV Row */}
                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Expiry</p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => handleCardExpiryChange(e.target.value.replace('/', ''))}
                      className="w-full bg-transparent text-lg font-black tracking-widest focus:outline-none placeholder:text-gray-700"
                      style={{ color: 'var(--text-color)' }}
                    />
                  </div>
                  <div className="w-20">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">CVV</p>
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => { setCardError(''); setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                      className="w-full bg-transparent text-lg font-black tracking-widest focus:outline-none placeholder:text-gray-700"
                      style={{ color: 'var(--text-color)' }}
                    />
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Cardholder Name</p>
                  <input
                    type="text"
                    placeholder="As on card"
                    value={cardName}
                    onChange={(e) => { setCardError(''); setCardName(e.target.value.toUpperCase()); }}
                    className="w-full bg-transparent text-sm font-black tracking-widest uppercase focus:outline-none placeholder:text-gray-700"
                    style={{ color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              {cardError && (
                <div className="flex items-center gap-2 px-2 text-red-500 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{cardError}</span>
                </div>
              )}

              {/* Security Note */}
              <div className="flex items-center gap-2 px-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">256-bit encrypted • PCI DSS compliant • Never stored</p>
              </div>

              <div className="space-y-4 pt-1">
                <PremiumButton
                  disabled={isCardSaving}
                  onClick={handleCardSubmit}
                  label={isCardSaving ? 'LINKING...' : 'LINK CARD'}
                />
                <button
                  onClick={() => setStep('celebration')}
                  className="w-full text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] py-2"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 'celebration' && (
            <div className="flex flex-col items-center text-center space-y-8 py-6 animate-in zoom-in-95 duration-700">
              <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_var(--brand-glow)]">
                 <PartyPopper className="w-10 h-10 text-black" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-color)' }}>PROFILE READY</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Goal Set: ₹{savingsGoal.toLocaleString()}</p>
              </div>
              <PremiumButton onClick={handleCompleteSetup} label="ENTER DASHBOARD" showSparkles />
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Back Button */}
      {step !== 'name' && step !== 'celebration' && (
        <button 
          onClick={() => {
            const steps: SetupStep[] = ['name', 'city', 'vibe', 'field', 'income', 'savings', 'identity-choice', 'details-review', 'ekyc', 'card-details', 'celebration'];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-500 hover:text-brand transition-colors z-20 group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
      )}

      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .slider-premium::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px; width: 24px;
          border-radius: 50%;
          background: white;
          border: 4px solid var(--brand-primary);
          box-shadow: 0 0 15px var(--brand-glow);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .slider-premium:active::-webkit-slider-thumb {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

const PremiumButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean; showSparkles?: boolean; }> = ({ label, onClick, disabled, showSparkles }) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={`w-full h-[72px] rounded-[24px] font-black uppercase tracking-widest flex items-center justify-between px-2 transition-all relative overflow-hidden shrink-0 ${disabled ? 'bg-white/5 text-gray-500' : 'bg-brand text-black shadow-[0_15px_35px_var(--brand-glow)] hover:scale-[1.01] active:scale-[0.98]'}`}
  >
    <div className="flex-1 text-center font-black text-lg ml-6">{label}</div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all mr-2 ${disabled ? 'bg-white/10' : 'bg-black/10'}`}>
      {showSparkles ? <Sparkles className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
    </div>
  </button>
);

const VibeCard = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="p-4 glass border border-white/5 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all hover:border-brand/50 hover:bg-brand/5 active:scale-95 group overflow-hidden">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-brand transition-all">
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 group-hover:text-white transition-colors">{label}</span>
  </button>
);

export default InitialSetup;
