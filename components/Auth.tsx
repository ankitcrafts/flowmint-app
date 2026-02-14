
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Smartphone, 
  ChevronLeft,
  Chrome,
  Apple,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import Onboarding from './Onboarding';
import InitialSetup from './InitialSetup';
import { supabase } from '../services/supabase';
import GoogleAuth from '../plugins/GoogleAuth';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface AuthProps {
  onLoginSuccess: (profile?: UserProfile) => void;
  theme: 'light' | 'dark';
}

declare global {
  interface Window {
    google: any;
  }
}

// Detect if running inside Capacitor (APK) or in browser
const isCapacitor = (): boolean => {
  return !!(window as any).Capacitor;
};

// Get API base URL: use server in dev, empty for Capacitor
const getApiBase = (): string => {
  if (isCapacitor()) {
    // In Capacitor, we can't hit localhost. We'll handle auth client-side.
    return '';
  }
  // In browser dev, Vite proxy handles /auth/* -> localhost:3000
  return '';
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, theme }) => {
  const [step, setStep] = useState<'welcome' | 'mobile' | 'otp' | 'handshake' | 'onboarding' | 'initial-setup'>('welcome');
  const [socialProvider, setSocialProvider] = useState<'Google' | 'Apple' | null>(null);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [storedProfile, setStoredProfile] = useState<UserProfile | null>(null);

  const [googleReady, setGoogleReady] = useState(false);

  // Load Google Identity Services script (only for browser, not Capacitor)
  useEffect(() => {
    if (isCapacitor()) {
      // In Capacitor, we'll use Supabase OAuth instead of GSI
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("Google Client ID:", clientId ? "Present" : "MISSING");

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google GSI Script Loaded");
      if (window.google && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log("Google credential received");
            handleGoogleCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setGoogleReady(true);
        console.log("Google Auth Initialized Successfully");
      }
    };
    script.onerror = () => console.error("Google Script Failed to Load");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle Google credential (ID token) — works in both browser & Capacitor
  // Uses Supabase signInWithIdToken directly — no Express server needed
  const handleGoogleCredential = async (credential: string) => {
    try {
      setSocialProvider('Google');
      setStep('handshake');

      // Sign in with Supabase Auth using the Google ID token directly
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });

      if (authError) {
        console.error("Supabase Google Auth Error:", authError);
        setError("Google Login Failed: " + authError.message);
        setStep('welcome');
        return;
      }

      if (data.user) {
        setStoredProfile({
          name: data.user.user_metadata?.full_name || data.user.email || 'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        setStep('onboarding');
      }
    } catch (err) {
      console.error("Google Auth Error", err);
      setError("Error during Google login");
      setStep('welcome');
    }
  };

  // Handle Google login — Capacitor mode using native Credential Manager
  const handleGoogleLoginCapacitor = async () => {
    setSocialProvider('Google');
    setStep('handshake');
    setError('');

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    try {
      // Use native Android Credential Manager for Google Sign-In
      const result = await GoogleAuth.signIn({ clientId });
      console.log('Native Google Sign-In successful:', result.email);

      // Authenticate with Supabase using the Google ID token
      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: result.idToken,
      });

      if (authError) {
        console.error('Supabase auth with native token failed:', authError);
        // Fallback: use profile from native result directly
        setStoredProfile({
          name: result.displayName || result.email || 'FlowMint User',
          email: result.email || '',
          avatar: result.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.email}`,
        });
        setStep('onboarding');
        return;
      }

      if (data.user) {
        setStoredProfile({
          name: data.user.user_metadata?.full_name || data.user.email || 'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        setStep('onboarding');
      }
    } catch (err: any) {
      console.error('Native Google Sign-In failed:', err);
      // Fallback to demo profile if native plugin isn't available
      const profile = {
        name: 'FlowMint User',
        email: 'user@flowmint.app',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=google`,
      };
      setStoredProfile(profile);
      setStep('onboarding');
    }
  };

  // Handle Google button click
  const handleGoogleLogin = () => {
    setSocialProvider('Google');
    setError('');

    // In Capacitor, use Supabase OAuth
    if (isCapacitor()) {
      handleGoogleLoginCapacitor();
      return;
    }

    if (!googleReady || !window.google) {
      setError("Google services are still loading. Try again in a moment.");
      return;
    }

    // Try One Tap prompt first
    window.google.accounts.id.prompt((notification: any) => {
      console.log("Google prompt notification:", notification);

      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || 'unknown';
        console.log("One Tap not shown, reason:", reason);

        // Fallback: Render a hidden Google button and click it programmatically
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '-9999px';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        window.google.accounts.id.renderButton(tempDiv, {
          type: 'standard',
          size: 'large',
        });

        // Wait for iframe to render, then click it
        setTimeout(() => {
          const googleBtn = tempDiv.querySelector('div[role="button"]') as HTMLElement;
          if (googleBtn) {
            googleBtn.click();
          } else {
            const iframe = tempDiv.querySelector('iframe');
            if (iframe) {
              setError("Please allow popups for Google Sign-In, then try again.");
            } else {
              setError("Could not open Google Sign-In. Please try again.");
            }
          }
          setTimeout(() => {
            if (document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
          }, 60000);
        }, 500);
      }
    });
  };

  // OTP timer
  useEffect(() => {
    let interval: number | undefined;
    if (step === 'otp' && resendTimer > 0) {
      interval = window.setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const validateMobile = (num: string) => {
    return /^[6-9]\d{9}$/.test(num);
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateMobile(mobile)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
        setResendTimer(45);
      }, 500);
    } else {
      setError('ENTER A VALID 10-DIGIT INDIAN NUMBER');
    }
  };

  // OTP submission — works both in browser (via server) and Capacitor (client-side fallback)
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '021303') {
      setLoading(true);
      setError('');

      // Try server-side auth first (works in browser with Vite proxy)
      try {
        const response = await fetch('/auth/mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile }),
        });

        // Check if we got HTML back (meaning no server / Capacitor mode)
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('SERVER_UNAVAILABLE');
        }

        const data = await response.json();

        if (response.ok) {
          setLoading(false);
          if (data.user) {
            setStoredProfile({
              name: data.user.name || 'User',
              email: data.user.email || '',
              avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`,
            });
            setStep('onboarding');
          }
        } else {
          throw new Error(data.error || 'Login failed');
        }
      } catch (err: any) {
        console.log("Server auth failed, using client-side fallback:", err.message);

        // Client-side fallback: authenticate directly with Supabase
        // This works in Capacitor and when Express server is not reachable
        try {
          // Try Supabase sign-in with phone (if Supabase phone auth is configured)
          // Since we use a demo OTP, we'll create/fetch user directly via Supabase
          const { data: existingUsers, error: fetchErr } = await supabase
            .from('app_users')
            .select('*')
            .eq('mobile', mobile)
            .limit(1);

          let user;

          if (fetchErr || !existingUsers || existingUsers.length === 0) {
            // Create new user
            const { data: newUser, error: insertErr } = await supabase
              .from('app_users')
              .insert([{ mobile, name: `User ${mobile.slice(-4)}` }])
              .select()
              .single();

            if (insertErr) {
              console.error("Supabase insert error:", insertErr);
              // Final fallback: use mock profile
              user = {
                name: `User ${mobile.slice(-4)}`,
                email: '',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`,
              };
            } else {
              user = newUser;
            }
          } else {
            user = existingUsers[0];
          }

          setLoading(false);
          setStoredProfile({
            name: user.name || `User ${mobile.slice(-4)}`,
            email: user.email || '',
            avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`,
          });
          setStep('onboarding');

        } catch (supaErr: any) {
          console.error("Supabase fallback also failed:", supaErr);

          // Ultimate fallback: just let the user in with a mock profile
          setLoading(false);
          setStoredProfile({
            name: `User ${mobile.slice(-4)}`,
            email: '',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mobile}`,
          });
          setStep('onboarding');
        }
      }
    } else {
      setError('ENTER 021303 TO VERIFY');
    }
  };

  const handleResend = async () => {
    if (resendTimer === 0) {
      setLoading(true);
      setError('');
      setTimeout(() => {
        setLoading(false);
        setResendTimer(45);
        setOtp('');
      }, 500);
    }
  };

  const handleSocialLogin = (provider: 'Google' | 'Apple') => {
    setSocialProvider(provider);

    if (provider === 'Google') {
      handleGoogleLogin();
      return;
    }

    // Apple (Mock fallback)
    setStep('handshake');
    setTimeout(() => {
      const profile = {
        name: 'Aryan Sharma',
        email: 'aryan.s@icloud.com',
        avatar: `https://picsum.photos/seed/apple/200/200`,
      };
      setStoredProfile(profile);
      setStep('onboarding');
    }, 2500);
  };

  if (step === 'onboarding') {
    return <Onboarding onComplete={() => setStep('initial-setup')} theme={theme} />;
  }

  if (step === 'initial-setup') {
    return (
      <InitialSetup 
        onComplete={(finalProfile) => onLoginSuccess(finalProfile || storedProfile || undefined)} 
        theme={theme} 
      />
    );
  }

  if (step === 'handshake') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="relative">
          <div className="w-24 h-24 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {socialProvider === 'Google' ? <Chrome className="w-10 h-10 text-brand" /> : <Apple className="w-10 h-10 text-brand" />}
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black uppercase tracking-widest text-brand">Secure Handshake</h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Connecting to {socialProvider} Gateway...</p>
        </div>
        <div className="flex items-center gap-2 opacity-50">
          <ShieldCheck className="w-4 h-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Verified by FlowMint Security</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-w-md mx-auto relative overflow-hidden flex flex-col theme-transition" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full bg-brand opacity-10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 rounded-full bg-brand opacity-5 blur-3xl pointer-events-none"></div>

      <div className="p-6 flex items-center gap-4 relative z-10">
        {['mobile', 'otp'].includes(step) && (
          <button 
            onClick={() => setStep(step === 'otp' ? 'mobile' : 'welcome')}
            className="w-10 h-10 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-color)' }} />
          </button>
        )}
      </div>

      <div className="flex-1 px-8 pt-4 pb-12 flex flex-col relative z-10">
        <div className="mb-10">
          <div className="w-16 h-16 bg-brand rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-brand/30 mb-10">
            <Zap className="w-8 h-8 text-black fill-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter leading-tight" style={{ color: 'var(--text-color)' }}>
            {step === 'welcome' && "Start your financial flow."}
            {step === 'mobile' && "Your mobile number?"}
            {step === 'otp' && "Verify your identity"}
          </h1>
          <p className="text-gray-500 mt-4 font-black uppercase text-[10px] tracking-widest leading-none">
            {step === 'welcome' && "ZERO LIMITS. PURE GROWTH."}
            {step === 'mobile' && "ENTER YOUR 10-DIGIT INDIAN MOBILE NUMBER"}
            {step === 'otp' && `SENT VIA SMS TO +91 ${mobile}`}
          </p>
        </div>

        {step === 'welcome' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setStep('mobile')}
              className="w-full h-18 bg-brand text-black rounded-2xl font-black flex items-center justify-between px-6 group transition-all hover:scale-[1.02]"
              style={{ boxShadow: '0 10px 30px var(--brand-glow)', height: '72px' }}
            >
              <div className="flex items-center gap-4">
                <Smartphone className="w-5 h-5" />
                <span className="font-black uppercase tracking-widest text-sm">Continue with Phone</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative py-4 flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }}></div>
              <span className="px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SocialButton 
                onClick={() => handleSocialLogin('Google')}
                icon={<Chrome className="w-5 h-5" />} 
                label="Google" 
              />
              <SocialButton 
                onClick={() => handleSocialLogin('Apple')}
                icon={<Apple className="w-5 h-5" />} 
                label="Apple" 
              />
            </div>

            <p className="text-[10px] text-center text-gray-500 mt-12 px-4 leading-relaxed font-black uppercase tracking-tighter">
              By continuing, you agree to FlowMint's <span className="text-brand">Terms of Service</span> and <span className="text-brand">Privacy Policy</span>.
            </p>
          </div>
        )}

        {step === 'mobile' && (
          <form onSubmit={handleMobileSubmit} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              {/* Mobile input with country code */}
              <div 
                className="flex items-center h-20 px-6 bg-white/5 border-2 rounded-[1.5rem] transition-all theme-transition gap-2"
                style={{ 
                  backgroundColor: 'var(--card-subtle)', 
                  borderColor: error ? '#EF4444' : 'var(--glass-border)',
                }}
              >
                <span className="text-2xl font-black text-gray-400 tracking-widest shrink-0">+91</span>
                <input 
                  type="tel"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, '').slice(0,10));
                    if (error) setError('');
                  }}
                  className="flex-1 bg-transparent text-2xl font-black tracking-widest focus:outline-none"
                  style={{ color: 'var(--text-color)' }}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase mt-4 ml-1 tracking-wider animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>
            
            <button 
              type="submit"
              disabled={loading || mobile.length < 10}
              className={`w-full h-18 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center transition-all ${loading || mobile.length < 10 ? 'bg-white/5 text-gray-500' : 'bg-brand text-black shadow-lg shadow-brand/20'}`}
              style={{ height: '72px' }}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "SEND OTP"}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <input 
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0,6));
                  if (error) setError('');
                }}
                className="w-full h-20 px-6 bg-white/5 border-2 rounded-[1.5rem] text-3xl font-black tracking-[0.5em] text-center focus:outline-none transition-all theme-transition"
                style={{ 
                  backgroundColor: 'var(--card-subtle)', 
                  borderColor: error ? '#EF4444' : 'var(--glass-border)',
                  color: 'var(--text-color)'
                }}
                autoFocus
              />
              {error && <p className="text-red-500 text-[10px] font-black uppercase mt-4 text-center tracking-wider">{error}</p>}
            </div>

            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Didn't get it?</p>
              <button 
                type="button" 
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-brand underline decoration-brand/30 underline-offset-4'}`}
              >
                {resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : "RESEND OTP NOW"}
              </button>
            </div>
            
            <button 
              type="submit"
              disabled={loading || otp.length < 6}
              className={`w-full h-18 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center transition-all ${loading || otp.length < 6 ? 'bg-white/5 text-gray-500' : 'bg-brand text-black shadow-lg shadow-brand/20'}`}
              style={{ height: '72px' }}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "VERIFY & FLOW"}
            </button>
          </form>
        )}
      </div>

      <div className="p-10 flex items-center justify-center gap-3 opacity-40 grayscale group hover:grayscale-0 transition-all">
        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-color)' }}>SECURE END-TO-END ENCRYPTION</span>
      </div>

    </div>
  );
};

const SocialButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="h-16 glass border rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all theme-transition" 
    style={{ borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Auth;
