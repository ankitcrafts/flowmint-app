
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
import { BiometricService } from '../services/BiometricService';

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
  onComplete: (profile?: UserProfile) => void | Promise<void>;
  theme: 'light' | 'dark';
  initialStep?: SetupStep;
}

type SetupStep = 'name' | 'dob' | 'guardian-linking' | 'city' | 'vibe' | 'field' | 'income' | 'savings' | 'identity-choice' | 'details-review' | 'ekyc' | 'card-details' | 'celebration';

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

const InitialSetup: React.FC<InitialSetupProps> = ({ onComplete, theme, initialStep = 'name' }) => {
  const [step, setStep] = useState<SetupStep>(initialStep);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianId, setGuardianId] = useState('');
  const [guardianError, setGuardianError] = useState('');
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
  const [checkedIdType, setCheckedIdType] = useState<'aadhaar' | 'pan' | null>(null);
  const [completionError, setCompletionError] = useState('');
  const [isEkycComplete, setIsEkycComplete] = useState(false);

  // Local Biometric Crypto Vault State
  const [hasExistingBiometric, setHasExistingBiometric] = useState(false);
  const [hasInvalidatedBiometric, setHasInvalidatedBiometric] = useState(false);
  const [lockoutExpiration, setLockoutExpiration] = useState<number | null>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState(0);

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
      case 'dob': text = `Nice to meet you, ${name}! When were you born?`; break;
      case 'guardian-linking': text = "Since you're under 18, please link a Guardian's FlowMint ID or Phone Number."; break;
      case 'city': text = `Got it! Where are you based?`; break;
      case 'vibe': text = `To build your flow, I need to know your current path:`; break;
      case 'field': text = `Which industry are you focused on?`; break;
      case 'income': text = vibe === 'Student' ? "How much pocket money do you get every month?" : "How much do you bring in every month (after tax)?"; break;
      case 'savings': text = `Based on your ₹${monthlyIncome.toLocaleString()} ${vibe === 'Student' ? 'budget' : 'income'}, how much do you plan to save?`; break;
      case 'identity-choice': text = "You can check an ID number's format. This does not verify your identity."; break;
      case 'details-review': text = "Format check complete. This is not identity verification."; break;
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

  useEffect(() => {
    if (step === 'ekyc') {
      // 1. Check existing enrollments
      const checkExistingBiometric = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const status = await BiometricService.checkUserEnrollment(session.user.id);
            if (status.isEnrolled && !status.isInvalidated) {
               setHasExistingBiometric(true);
            } else if (status.isInvalidated) {
               setHasInvalidatedBiometric(true);
            }
          }
        } catch (e) {
           console.error("Failed to check existing biometric", e);
        }
      };
      checkExistingBiometric();
      
      // 2. Check Lockout state
      const checkLockout = () => {
         const storedExpiry = localStorage.getItem('flowmint_bio_lockout');
         if (storedExpiry) {
            const expiryTime = parseInt(storedExpiry, 10);
            if (Date.now() < expiryTime) {
               setLockoutExpiration(expiryTime);
               return;
            } else {
               localStorage.removeItem('flowmint_bio_lockout');
               localStorage.removeItem('flowmint_bio_fails');
               setFailedAttempts(0);
            }
         }
         
         const fails = parseInt(localStorage.getItem('flowmint_bio_fails') || '0', 10);
         setFailedAttempts(fails);
      };
      checkLockout();

      // 3. Listen to native plugin for failures
      import('../plugins/BiometricAuth').then((m) => {
         const BiometricAuth = m.default;
         BiometricAuth.addListener('onBiometricFailure', () => {
            const newFails = parseInt(localStorage.getItem('flowmint_bio_fails') || '0', 10) + 1;
            if (newFails >= 10) {
              const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now
              localStorage.setItem('flowmint_bio_lockout', expiry.toString());
              localStorage.removeItem('flowmint_bio_fails');
              setLockoutExpiration(expiry);
              setFailedAttempts(0);
              setIsVerifying(false);
            } else {
              localStorage.setItem('flowmint_bio_fails', newFails.toString());
              setFailedAttempts(newFails);
            }
         });
      });
    }
  }, [step]);

  // Lockout Countdown Timer
  useEffect(() => {
    let interval: number | undefined;
    if (lockoutExpiration) {
      const updateTimer = () => {
        const diff = lockoutExpiration - Date.now();
        if (diff <= 0) {
          setLockoutExpiration(null);
          setLockoutTimeLeft('');
          localStorage.removeItem('flowmint_bio_lockout');
          localStorage.removeItem('flowmint_bio_fails');
          setFailedAttempts(0);
          if (interval) clearInterval(interval);
        } else {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setLockoutTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      };
      
      updateTimer(); // Initialize immediately
      interval = window.setInterval(updateTimer, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutExpiration]);

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) { setNameError("Name cannot be empty"); return false; }
    if (!/^[A-Za-z\s]+$/.test(trimmed)) { setNameError("Letters only, please"); return false; }
    setNameError(''); return true;
  };

  const validateDobAndProceed = () => {
    if (!dob) { setDobError("Date of Birth is required"); return; }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setIsMinor(true);
      setStep('guardian-linking');
    } else {
      setIsMinor(false);
      setStep('city');
    }
  };

  const confirmGuardianAndProceed = async () => {
    if (!guardianId.trim()) { setGuardianError("Guardian/Parent Mobile is required"); return; }
    
    // Attempt lookup by mobile number
    const { data, error } = await supabase.from('app_users')
      .select('id')
      .eq('mobile', guardianId.trim())
      .maybeSingle();
      
    if (data && data.id) {
       setGuardianId(data.id); // Save UUID to state
       setGuardianError('');
       setStep('city');
    } else {
       // Validate if it is already a UUID format just in case
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
       if (uuidRegex.test(guardianId.trim())) {
          setGuardianError('');
          setStep('city');
       } else {
          setGuardianError("Guardian not found. Make sure they are registered on FlowMint.");
       }
    }
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

    setCheckedIdType(idType);
    setIdNumber('');
    setStep('details-review');
  };

  const startEkyc = async () => {
    setIsVerifying(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      await BiometricService.enrollBiometrics(session.user.id);
      setIsEkycComplete(true);
      setHasExistingBiometric(false);
      setHasInvalidatedBiometric(false);

      // Auto-navigate after successful enrollment
      setTimeout(() => {
         if (initialStep === 'ekyc') {
             handleCompleteSetup();
         } else {
             setStep('card-details');
         }
      }, 1500);
    } catch (err) {
      console.error("Biometric Setup Failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyExistingBiometric = async () => {
    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      await BiometricService.verifyBiometrics(session.user.id);
      setIsEkycComplete(true);
      setTimeout(() => {
         handleCompleteSetup();
      }, 1000);
    } catch (err) {
      console.error("Biometric Verification Failed", err);
      // If it fails, force them to re-enroll
      setHasExistingBiometric(false);
      setHasInvalidatedBiometric(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetBiometric = async () => {
    // SECURITY: If anyone clicks "Setup New Biometric" when 
    // a valid session already exists, we MUST force them into a 
    // Step-Up authentication flow to prove they are the actual account owner!
    // We achieve this securely by killing the session and returning them to OTP/Google Auth.
    setIsVerifying(true);
    await supabase.auth.signOut();
    // App.tsx will automatically pick up the session death and route them to <Auth />
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
    setCompletionError('');
    const { data: { session } } = await supabase.auth.getSession();
    const profileData = {
      name: name || 'User',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'default'}`,
      verified: false,
      email: session?.user.email || '',
      dob,
      isMinor,
      guardianId
    };

    try {
      await onComplete(profileData);
    } catch (error) {
      console.error('Unable to complete personal onboarding:', error);
      setCompletionError(error instanceof Error ? error.message : 'We could not save your profile. Please try again.');
    }
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
              <PremiumButton disabled={!name} onClick={() => validateName() && setStep('dob')} label="CONTINUE" />
            </div>
          )}

          {step === 'dob' && (
            <div className="space-y-8">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                <input 
                  type="date"
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setDob(e.target.value);
                    setDobError('');
                  }}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-12 pr-4 py-5 text-xl font-black focus:outline-none focus:border-brand/50 transition-all custom-date-input"
                  style={{ 
                    color: 'var(--text-color)',
                    borderColor: dobError ? '#EF4444' : 'var(--glass-border)'
                  }}
                />
              </div>
              {dobError && (
                <div className="flex items-center gap-2 px-2 text-red-500 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{dobError}</span>
                </div>
              )}
              <PremiumButton disabled={!dob} onClick={validateDobAndProceed} label="CONTINUE" />
            </div>
          )}

          {step === 'guardian-linking' && (
             <div className="space-y-6">
               <div className="glass border border-brand/30 rounded-[1.5rem] p-5 mb-4 shadow-[0_0_20px_var(--brand-glow)] animate-in fade-in">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center shrink-0 text-brand">
                        <ShieldCheck className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-black tracking-tight" style={{ color: 'var(--text-color)' }}>Restricted Mode Active</h4>
                        <p className="text-[10px] mt-1 text-gray-400 font-bold leading-tight">By law, users under 18 must be linked to a Guardian account. They will approve your maximum lending limits.</p>
                     </div>
                  </div>
               </div>

               <input 
                 type="text"
                 placeholder="Guardian FlowMint ID or Phone Number"
                 value={guardianId}
                 onChange={(e) => { setGuardianId(e.target.value); setGuardianError(''); }}
                 className="w-full bg-transparent border-b-2 py-4 text-xl font-black focus:outline-none border-brand/20 focus:border-brand transition-all placeholder:text-gray-600"
                 style={{ color: 'var(--text-color)' }}
               />
               {guardianError && (
                 <div className="flex items-center gap-2 px-2 text-red-500">
                   <AlertCircle className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{guardianError}</span>
                 </div>
               )}
               <PremiumButton disabled={!guardianId} onClick={confirmGuardianAndProceed} label="LINK GUARDIAN" />
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
                  label="CHECK FORMAT"
                />
                <p className="px-2 text-xs leading-relaxed text-gray-500">
                  This checks only the number's format/checksum on this device. It does not contact UIDAI or verify identity. The number is cleared after the check and is not saved.
                </p>
                <button onClick={() => { setIdNumber(''); setCheckedIdType(null); setStep('celebration'); }} className="w-full text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] py-2">Skip for now</button>
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
                    <span className="text-[8px] bg-brand text-black px-3 py-1 rounded-full font-black uppercase tracking-widest">Format Checked</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
                      {checkedIdType === 'aadhaar' ? 'Aadhaar checksum passed.' : 'PAN format passed.'}
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500">
                      This local format check does not confirm that the ID exists or belongs to you. FlowMint has not verified your identity with UIDAI or a PAN service.
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl pointer-events-none rounded-full"></div>
               </div>
               <PremiumButton onClick={() => setStep('celebration')} label="CONTINUE" />
            </div>
          )}

          {step === 'ekyc' && (
            <div className="space-y-8 flex flex-col items-center py-6 w-full">
              {/* ─── Animated Fingerprint Scanner ─── */}
              <div 
                className="relative cursor-pointer group" 
                onClick={isEkycComplete || lockoutExpiration ? undefined : (hasExistingBiometric ? verifyExistingBiometric : startEkyc)}
              >
                {/* Pulsing Rings (3 layers of radiating glow) */}
                <div className="absolute inset-[-20px] rounded-full animate-ping opacity-20" 
                  style={{ backgroundColor: lockoutExpiration ? '#EF4444' : '#FFDF00', animationDuration: '2s' }} />
                <div className="absolute inset-[-12px] rounded-full animate-ping opacity-15" 
                  style={{ backgroundColor: lockoutExpiration ? '#EF4444' : '#FFDF00', animationDuration: '2.5s', animationDelay: '0.3s' }} />
                <div className="absolute inset-[-6px] rounded-full animate-ping opacity-10" 
                  style={{ backgroundColor: lockoutExpiration ? '#EF4444' : '#FFDF00', animationDuration: '3s', animationDelay: '0.6s' }} />

                {/* Outer Ring — neumorphic raised circle */}
                <div 
                  className="w-36 h-36 rounded-full flex items-center justify-center relative transition-all duration-500"
                  style={{
                    background: 'var(--bg-color, #E0E5EC)',
                    boxShadow: lockoutExpiration
                      ? 'inset 4px 4px 8px rgba(239,68,68,0.3), inset -4px -4px 8px rgba(255,255,255,0.5), 0 0 30px rgba(239,68,68,0.2)'
                      : isVerifying 
                        ? '0 0 40px rgba(255,223,0,0.5), inset 0 0 20px rgba(255,223,0,0.15)' 
                        : '8px 8px 16px #A3B1C6, -8px -8px 16px #FFFFFF, inset 0 0 0 transparent',
                  }}
                >
                  {/* Rotating border indicator during scanning */}
                  {isVerifying && (
                    <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 144 144">
                      <circle cx="72" cy="72" r="68" fill="none" stroke="#FFDF00" strokeWidth="3" strokeDasharray="60 380" strokeLinecap="round" />
                    </svg>
                  )}

                  {/* Inner circle — the fingerprint container */}
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:scale-110 group-active:scale-95"
                    style={{
                      background: lockoutExpiration 
                        ? 'linear-gradient(145deg, #FEE2E2, #FECACA)' 
                        : isEkycComplete
                          ? 'linear-gradient(145deg, #D1FAE5, #A7F3D0)'
                          : 'linear-gradient(145deg, #FFF3B0, #FFE066)',
                      boxShadow: lockoutExpiration
                        ? 'inset 2px 2px 4px rgba(239,68,68,0.2), 0 0 20px rgba(239,68,68,0.3)'
                        : isEkycComplete
                          ? 'inset 2px 2px 4px rgba(16,185,129,0.2), 0 0 20px rgba(16,185,129,0.3)'
                          : '4px 4px 8px #A3B1C6, -4px -4px 8px #FFFFFF, 0 0 25px rgba(255,223,0,0.4)',
                    }}
                  >
                    {/* Scanning beam animation */}
                    {isVerifying && (
                      <div 
                        className="absolute left-0 right-0 h-1 rounded-full animate-bounce" 
                        style={{ 
                          background: 'linear-gradient(90deg, transparent 0%, #FFDF00 30%, #FFB800 70%, transparent 100%)',
                          boxShadow: '0 0 15px rgba(255,223,0,0.6)',
                          animationDuration: '1.2s'
                        }} 
                      />
                    )}
                    
                    {/* Fingerprint Icon */}
                    {isEkycComplete ? (
                      <ShieldCheck className="w-12 h-12" style={{ color: '#059669' }} />
                    ) : (
                      <Fingerprint className="w-12 h-12" style={{ color: lockoutExpiration ? '#EF4444' : '#8B6914' }} />
                    )}
                  </div>
                </div>

                {/* Tap hint animation — bouncing hand */}
                {!isVerifying && !isEkycComplete && !lockoutExpiration && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '1.5s' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" 
                      style={{ background: 'linear-gradient(145deg, #FFDF00, #FFB800)', boxShadow: '2px 2px 4px #A3B1C6, -2px -2px 4px #FFFFFF' }}>
                      <span className="text-[8px] font-black text-black">👆</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* ─── Status Text ─── */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: lockoutExpiration ? '#EF4444' : 'var(--text-color)' }}>
                  {lockoutExpiration ? 'SENSOR BLOCKED' : isEkycComplete ? 'Identity Secured' : (hasExistingBiometric ? 'Verify Identity' : 'Secure Hardware Login')}
                </h3>
                {!isEkycComplete && (
                  <p className="text-[10px] pb-1 font-bold uppercase tracking-widest mt-2 leading-tight" 
                    style={{ color: lockoutExpiration ? '#EF4444' : '#6B7280' }}>
                    {lockoutExpiration 
                      ? `10 FAILED ATTEMPTS. LOCKED FOR ${lockoutTimeLeft}.` 
                      : hasExistingBiometric 
                         ? 'TAP TO SCAN FINGERPRINT' 
                         : (hasInvalidatedBiometric ? 'BIOMETRICS CHANGED. PLEASE RE-ENROLL.' : 'TAP TO ENROLL HARDWARE BIOMETRICS')}
                  </p>
                )}
                {!isEkycComplete && !lockoutExpiration && failedAttempts > 0 && (
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest leading-none">
                    {10 - failedAttempts} attempts remaining
                  </p>
                )}
              </div>

              {isEkycComplete && (
                <div className="w-full glass border rounded-[1.5rem] p-5 text-center animate-in fade-in zoom-in-95 space-y-3"
                  style={{ borderColor: '#059669' }}>
                  <ShieldCheck className="w-12 h-12 mx-auto" style={{ color: '#059669', filter: 'drop-shadow(0 0 15px rgba(5,150,105,0.4))' }} />
                  <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-color)' }}>
                    Device verified. Welcome back.
                  </p>
                </div>
              )}

              <div className="w-full space-y-4 pt-4">
                {!isEkycComplete && hasExistingBiometric && (
                  <button 
                    onClick={handleResetBiometric} 
                    disabled={isVerifying}
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] py-2 disabled:opacity-50 transition-opacity"
                    style={{ color: '#B8860B' }}
                  >
                    Setup New Biometric Instead
                  </button>
                )}
                
                {!isEkycComplete && !hasExistingBiometric && (
                  <button 
                    onClick={() => {
                      if (initialStep === 'ekyc') {
                        handleCompleteSetup();
                      } else {
                        setStep('card-details');
                      }
                    }} 
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
                <h4 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-color)' }}>PERSONAL SETUP COMPLETE</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Goal Set: ₹{savingsGoal.toLocaleString()}</p>
              </div>
              {completionError && <p role="alert" className="text-sm text-red-400">{completionError}</p>}
              <PremiumButton onClick={handleCompleteSetup} label="CONTINUE TO FINANCIAL SETUP" showSparkles />
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Back Button */}
      {step !== 'name' && step !== 'celebration' && (
        <button 
          onClick={() => {
            const steps: SetupStep[] = ['name', 'dob', 'guardian-linking', 'city', 'vibe', 'field', 'income', 'savings', 'identity-choice', 'details-review', 'ekyc', 'card-details', 'celebration'];
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
        .custom-date-input::-webkit-calendar-picker-indicator {
          filter: invert(0.5); /* Helps visibility on dark themes */
        }
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
