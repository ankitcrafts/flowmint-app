import { createHmac, randomBytes, randomInt } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import nodemailer from 'nodemailer';

const OTP_LIFETIME_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 60_000;
const getOtpHashKey = () => process.env.OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many code requests. Wait 15 minutes before trying again.' },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Wait 15 minutes before trying again.' },
});

const isValidEmail = (email) =>
  typeof email === 'string' &&
  email.length <= 320 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashOtp = (email, salt, code, hashKey) =>
  createHmac('sha256', hashKey)
    .update(`${email}:${salt}:${code}`)
    .digest('hex');

const getOtpDatabaseError = (error) => {
  const code = typeof error?.code === 'string' ? error.code : '';
  if (code === '42P01' || code === 'PGRST202' || code === 'PGRST205') {
    return 'OTP database setup is missing. Apply supabase/migrations/006_email_login_otp.sql, then try again.';
  }
  return 'Email sign-in is temporarily unavailable. Please try again later.';
};

const getTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.replace(/\s+/g, '');

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  if ((user && !password) || (!user && password)) return null;

  const from = process.env.SMTP_FROM || user;
  if (!from) return null;

  return {
    from,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      ...(user ? { auth: { user, pass: password } } : {}),
    }),
  };
};

const findAuthUser = async (supabase, email) => {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
};

export const createEmailOtpRouter = (supabase) => {
  const router = Router();

  router.post('/send', sendLimiter, async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    const hashKey = getOtpHashKey();
    if (!hashKey) {
      console.error('Email OTP hashing is unavailable: no server-side hash secret is configured.');
      return res.status(503).json({ error: 'Email sign-in is temporarily unavailable. Please try again later.' });
    }

    const mail = getTransport();
    if (!mail) {
      console.error('Email OTP delivery is unavailable: configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.');
      return res.status(503).json({
        error: 'Email delivery is not configured on the server. Configure SMTP settings, then try again.',
      });
    }

    const { data: previousOtp, error: lookupError } = await supabase
      .from('email_login_otps')
      .select('last_sent_at')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) {
      console.error('Unable to check email OTP cooldown:', lookupError.code || 'database error');
      return res.status(503).json({ error: getOtpDatabaseError(lookupError) });
    }

    if (previousOtp?.last_sent_at && Date.now() - Date.parse(previousOtp.last_sent_at) < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Wait 60 seconds before requesting another code.' });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const salt = randomBytes(16).toString('hex');
    const { error: saveError } = await supabase
      .from('email_login_otps')
      .upsert({
        email,
        otp_hash: hashOtp(email, salt, code, hashKey),
        otp_salt: salt,
        expires_at: new Date(Date.now() + OTP_LIFETIME_MINUTES * 60_000).toISOString(),
        last_sent_at: new Date().toISOString(),
        failed_attempts: 0,
      }, { onConflict: 'email' });

    if (saveError) {
      console.error('Unable to save email OTP:', saveError.code || 'database error');
      return res.status(503).json({ error: getOtpDatabaseError(saveError) });
    }

    try {
      await mail.transporter.sendMail({
        from: mail.from,
        to: email,
        subject: 'Your FlowMint sign-in code',
        text: `Your FlowMint verification code is ${code}. It expires in ${OTP_LIFETIME_MINUTES} minutes. If you did not request this code, you can ignore this email.`,
        html: `<!doctype html><html><body style="margin:0;padding:32px;background:#08110c;color:#f4f7f4;font-family:Arial,sans-serif"><main style="max-width:440px;margin:auto;padding:32px;border:1px solid #25352b;border-radius:20px;background:#101b14"><p style="color:#b9f36a;font-weight:bold;letter-spacing:2px">FLOWMINT SECURE SIGN-IN</p><h1 style="font-size:24px">Your verification code</h1><p>Enter this one-time code in FlowMint to continue:</p><p style="padding:18px;border:1px solid #34483a;border-radius:12px;background:#0a130d;color:#b9f36a;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p><p style="color:#b7c2ba">This code expires in ${OTP_LIFETIME_MINUTES} minutes. If you did not request it, you can ignore this email.</p></main></body></html>`,
      });
    } catch (sendError) {
      const { error: cleanupError } = await supabase
        .from('email_login_otps')
        .delete()
        .eq('email', email)
        .eq('otp_salt', salt);
      if (cleanupError) {
        console.error('Unable to remove undelivered email OTP:', cleanupError.code || 'database error');
      }
      console.error(
        'SMTP failed to deliver FlowMint OTP:',
        sendError?.code || 'unknown mail error',
        sendError?.responseCode ? `(${sendError.responseCode})` : '',
        sendError?.command ? `during ${sendError.command}` : ''
      );
      if (sendError?.code === 'EAUTH' || sendError?.responseCode === 535) {
        return res.status(502).json({
          error: 'Gmail rejected the SMTP login. Use a current 16-character Google App Password for this account (remove its display spaces), with 2-Step Verification enabled.',
        });
      }
      return res.status(502).json({
        error: 'The email provider could not deliver your code. Check the server SMTP settings and provider delivery logs.',
      });
    }

    return res.status(200).json({
      message: 'A 6-digit verification code was sent. Check your inbox and spam folder.',
      expires_in_seconds: OTP_LIFETIME_MINUTES * 60,
    });
  });

  router.post('/verify', verifyLimiter, async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Enter a valid email address and the 6-digit code from your email.' });
    }

    const hashKey = getOtpHashKey();
    if (!hashKey) {
      console.error('Email OTP verification is unavailable: no server-side hash secret is configured.');
      return res.status(503).json({ error: 'Email sign-in is temporarily unavailable. Please try again later.' });
    }

    const { data: savedOtp, error: savedOtpError } = await supabase
      .from('email_login_otps')
      .select('otp_salt')
      .eq('email', email)
      .maybeSingle();

    if (savedOtpError) {
      console.error('Unable to load email OTP for verification:', savedOtpError.code || 'database error');
      return res.status(503).json({ error: getOtpDatabaseError(savedOtpError) });
    }
    if (!savedOtp?.otp_salt) {
      return res.status(400).json({ error: 'No active code was found. Request a new code and try again.' });
    }

    const { data: verification, error: verificationError } = await supabase.rpc('consume_email_login_otp', {
      p_email: email,
      p_otp_hash: hashOtp(email, savedOtp.otp_salt, code, hashKey),
    });

    if (verificationError) {
      console.error('Unable to verify email OTP:', verificationError.code || 'database error');
      return res.status(503).json({ error: getOtpDatabaseError(verificationError) });
    }

    return finishVerification(verification, email, supabase, res);
  });

  return router;
};

const finishVerification = async (verification, email, supabase, res) => {
  if (verification === 'expired') {
    return res.status(400).json({ error: 'That code has expired. Request a new code and try again.' });
  }
  if (verification === 'locked') {
    return res.status(429).json({ error: 'Too many incorrect codes. Request a new code and try again.' });
  }
  if (verification !== 'verified') {
    return res.status(400).json({ error: 'That code is incorrect. Check it and try again, or request a new code.' });
  }

  try {
    let user = await findAuthUser(supabase, email);
    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
      if (error) throw error;
      user = data.user;
    }

    const { data, error } = await supabase.auth.admin.generateLink({ type: 'magiclink', email });
    if (error) throw error;
    if (!data.properties.hashed_token) throw new Error('Supabase did not return a sign-in token.');

    return res.status(200).json({
      token_hash: data.properties.hashed_token,
      type: data.properties.verification_type,
    });
  } catch (error) {
    console.error('Unable to create Supabase session after email OTP verification:', error?.code || 'auth error');
    return res.status(503).json({
      error: 'Your email code was accepted, but sign-in could not be completed. Request a new code and try again.',
    });
  }
};
