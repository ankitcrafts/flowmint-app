import { useEffect, useRef, useState, type FormEvent } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { ArrowRight, ChevronLeft, Chrome, Loader2, Mail, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../services/supabase';
import {
  clearGoogleOAuthPending,
  setGoogleOAuthPending,
  setStoredAuthMethod,
} from '../services/authMethod';
import { getApiBase, isNativeApp } from '../utils/platform';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

interface AuthProps {
  onLoginSuccess: (profile?: UserProfile) => void | Promise<void>;
  theme: 'light' | 'dark';
}

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const NATIVE_AUTH_REDIRECT = 'com.flowmint.app://auth/callback';
const isValidOtp = (value: string) => /^\d{6}$/.test(value);

const postEmailOtp = async (action: 'send' | 'verify', email: string, code?: string) => {
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}/auth/email-otp/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'send' ? { email } : { email, code }),
    });
  } catch {
    throw new Error('Could not reach the sign-in server. Check your connection and try again.');
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error('The sign-in server returned an invalid response. Please try again.');
  }

  if (typeof result !== 'object' || result === null) {
    throw new Error('The sign-in server returned an invalid response. Please try again.');
  }

  const payload = result as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'The request failed. Please try again.');
  }

  return payload;
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const processedOAuthCodes = useRef(new Set<string>());

  const finishGoogleSignIn = async (user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  }) => {
    const emailAddress = user.email || '';
    const metadata = user.user_metadata || {};
    clearGoogleOAuthPending();
    setStoredAuthMethod('google');
    await onLoginSuccess({
      name: String(metadata.full_name || metadata.name || emailAddress.split('@')[0] || 'FlowMint User'),
      email: emailAddress,
      avatar: String(metadata.avatar_url || metadata.picture || ''),
    });
  };

  useEffect(() => {
    if (!isNativeApp()) return;

    const handleOAuthUrl = async (url: string) => {
      const callback = new URL(url);
      if (
        callback.protocol !== 'com.flowmint.app:' ||
        callback.hostname !== 'auth' ||
        callback.pathname !== '/callback'
      ) return;

      const authError = callback.searchParams.get('error_description') || callback.searchParams.get('error');
      if (authError) {
        setError(`Google sign-in failed: ${authError}`);
        setLoading(false);
        void Browser.close().catch((closeError) => console.warn('Unable to close OAuth browser:', closeError));
        return;
      }

      const code = callback.searchParams.get('code');
      if (!code || processedOAuthCodes.current.has(code)) return;
      processedOAuthCodes.current.add(code);

      setLoading(true);
      setError('');
      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        if (!data.user || !data.session) {
          throw new Error('Google OAuth completed without an authenticated session.');
        }
        await finishGoogleSignIn(data.user);
      } catch (callbackError) {
        processedOAuthCodes.current.delete(code);
        console.error('Unable to complete Google OAuth callback:', callbackError);
        setError('Google sign-in could not be completed. Please try again.');
      } finally {
        setLoading(false);
        void Browser.close().catch((closeError) => console.warn('Unable to close OAuth browser:', closeError));
      }
    };

    let removeListener: (() => void) | undefined;
    void CapacitorApp.addListener('appUrlOpen', ({ url }) => { void handleOAuthUrl(url); })
      .then((listener) => { removeListener = () => { void listener.remove(); }; })
      .catch((listenerError) => {
        console.error('Unable to listen for Google OAuth callbacks:', listenerError);
        setError('Google sign-in is unavailable on this device.');
      });

    void CapacitorApp.getLaunchUrl()
      .then((launch) => { if (launch?.url) void handleOAuthUrl(launch.url); })
      .catch((launchError) => console.error('Unable to check app launch URL:', launchError));

    return () => removeListener?.();
  }, []);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      setGoogleOAuthPending();
      const native = isNativeApp();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: native ? NATIVE_AUTH_REDIRECT : `${window.location.origin}/`,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('Supabase did not return a Google OAuth URL.');

      if (native) {
        await Browser.open({ url: data.url, presentationStyle: 'popover' });
      } else {
        window.location.assign(data.url);
      }
    } catch (oauthError) {
      clearGoogleOAuthPending();
      console.error('Unable to start Google sign-in:', oauthError);
      setError('Google sign-in could not be started. Check the Supabase Google provider configuration and try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = window.setInterval(() => {
      setResendTimer((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step, resendTimer]);

  const sendOtp = async (normalizedEmail: string) => {
    const result = await postEmailOtp('send', normalizedEmail);
    if (typeof result.message !== 'string') {
      throw new Error('The sign-in server did not confirm that an email was sent.');
    }
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendOtp(normalizedEmail);
      setEmail(normalizedEmail);
      setOtp('');
      setStep('otp');
      setResendTimer(RESEND_COOLDOWN_SECONDS);
    } catch (sendError) {
      console.error('Unable to send FlowMint email OTP:', sendError);
      setError(sendError instanceof Error ? sendError.message : 'We could not send the verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidOtp(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await postEmailOtp('verify', email, otp);
      if (typeof result.token_hash !== 'string') {
        throw new Error('Your code was accepted, but a sign-in session could not be created. Request a new code.');
      }

      const { data, error: authError } = await supabase.auth.verifyOtp({
        token_hash: result.token_hash,
        type: 'magiclink',
      });
      if (authError) {
        console.error('Unable to establish Supabase session after email OTP verification:', authError);
        throw new Error('Your code was accepted, but FlowMint could not start a session. Request a new code and try again.');
      }
      if (!data.user || !data.session) {
        throw new Error('Your code was accepted, but FlowMint could not start a session. Request a new code and try again.');
      }

      setStoredAuthMethod('email_otp');
      await onLoginSuccess({
        name: data.user.user_metadata?.full_name || email.split('@')[0],
        email: data.user.email || email,
        avatar: data.user.user_metadata?.avatar_url || '',
      });
      setOtp('');
    } catch (verifyError) {
      console.error('FlowMint email OTP verification failed:', verifyError);
      setError(verifyError instanceof Error ? verifyError.message : 'That code could not be verified. Check it and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading || resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      await sendOtp(email);
      setOtp('');
      setResendTimer(RESEND_COOLDOWN_SECONDS);
    } catch (sendError) {
      console.error('Unable to resend FlowMint email OTP:', sendError);
      setError(sendError instanceof Error ? sendError.message : 'We could not send another code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('email');
    setOtp('');
    setResendTimer(0);
    setError('');
  };

  return (
    <main className="min-h-screen max-w-md mx-auto relative overflow-hidden flex flex-col theme-transition" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full bg-brand opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 rounded-full bg-brand opacity-5 blur-3xl pointer-events-none" />

      <div className="p-6 relative z-10">
        {step === 'otp' && (
          <button
            type="button"
            onClick={goBack}
            disabled={loading}
            aria-label="Change email address"
            className="w-10 h-10 rounded-xl glass flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-color)' }} />
          </button>
        )}
      </div>

      <section className="flex-1 px-8 pt-4 pb-12 flex flex-col relative z-10">
        <div className="mb-10">
          <div className="w-16 h-16 bg-brand rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-brand/30 mb-8">
            <Zap className="w-8 h-8 text-black fill-black" />
          </div>
          <p className="text-brand text-xs font-black uppercase tracking-[0.2em]">Your AI Financial Copilot</p>
          <h1 className="mt-4 text-4xl font-black tracking-tighter leading-tight" style={{ color: 'var(--text-color)' }}>
            {step === 'email' ? 'Understand your money.' : 'Check your inbox.'}
          </h1>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            {step === 'email'
              ? 'Enter your email address and we’ll send you a one-time verification code.'
              : <>We sent a one-time code to <strong className="text-brand">{email}</strong>.</>}
          </p>
        </div>

        {step === 'email' ? (
          <>
          <form onSubmit={handleSendOtp} className="space-y-6">
            <label className="block">
              <span className="sr-only">Email address</span>
              <span className="flex items-center gap-3 rounded-2xl border px-5" style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--card-subtle)' }}>
                <Mail className="h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className="h-16 w-full bg-transparent text-base outline-none"
                  style={{ color: 'var(--text-color)' }}
                />
              </span>
            </label>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-[72px] rounded-2xl bg-brand text-black font-black uppercase tracking-widest flex items-center justify-between px-6 disabled:opacity-60"
            >
              <span>Send email code</span>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </button>
          </form>
            <div className="relative my-6 flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }} />
              <span className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Or</span>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--glass-border)' }} />
            </div>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={loading}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border font-bold disabled:opacity-60"
              style={{ borderColor: 'var(--glass-border)', color: 'var(--text-color)' }}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Chrome className="h-5 w-5" />}
              Continue with Google
            </button>
            </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <label className="block">
              <span className="sr-only">Six-digit email verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={OTP_LENGTH}
                required
                value={otp}
                onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)); setError(''); }}
                placeholder="000000"
                className="w-full h-20 px-6 rounded-2xl border-2 text-3xl font-black tracking-[0.5em] text-center outline-none"
                style={{ borderColor: error ? '#EF4444' : 'var(--glass-border)', backgroundColor: 'var(--card-subtle)', color: 'var(--text-color)' }}
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-400 text-center">{error}</p>}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Code expires after 10 minutes.</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendTimer > 0}
                className="font-black text-brand disabled:text-gray-600"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !isValidOtp(otp)}
              className="w-full h-[72px] rounded-2xl bg-brand text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify and continue <ArrowRight className="h-5 w-5" /></>}
            </button>
          </form>
        )}
      </section>

      <footer className="px-8 pb-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        <ShieldCheck className="h-4 w-4 text-brand" />
        Verified email sign-in
      </footer>
    </main>
  );
};

export default Auth;
