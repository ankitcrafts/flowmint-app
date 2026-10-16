CREATE TABLE IF NOT EXISTS public.email_login_otps (
  email TEXT PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts BETWEEN 0 AND 5)
);

ALTER TABLE public.email_login_otps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.email_login_otps FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.email_login_otps TO service_role;

CREATE OR REPLACE FUNCTION public.consume_email_login_otp(p_email TEXT, p_otp_hash TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  saved_otp public.email_login_otps%ROWTYPE;
  next_failed_attempts INTEGER;
BEGIN
  SELECT *
    INTO saved_otp
    FROM public.email_login_otps
   WHERE email = lower(trim(p_email))
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'invalid';
  END IF;

  IF saved_otp.expires_at <= now() THEN
    DELETE FROM public.email_login_otps WHERE email = saved_otp.email;
    RETURN 'expired';
  END IF;

  IF saved_otp.failed_attempts >= 5 THEN
    DELETE FROM public.email_login_otps WHERE email = saved_otp.email;
    RETURN 'locked';
  END IF;

  IF saved_otp.otp_hash = p_otp_hash THEN
    DELETE FROM public.email_login_otps WHERE email = saved_otp.email;
    RETURN 'verified';
  END IF;

  UPDATE public.email_login_otps
     SET failed_attempts = failed_attempts + 1
   WHERE email = saved_otp.email
   RETURNING failed_attempts INTO next_failed_attempts;

  IF next_failed_attempts >= 5 THEN
    DELETE FROM public.email_login_otps WHERE email = saved_otp.email;
    RETURN 'locked';
  END IF;

  RETURN 'invalid';
END;
$$;

REVOKE ALL ON FUNCTION public.consume_email_login_otp(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_email_login_otp(TEXT, TEXT) TO service_role;
