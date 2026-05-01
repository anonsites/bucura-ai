-- ==============================================================
-- BUCURA AI DATABASE SCHEMA (SUPABASE + POSTGRES)
-- ==============================================================
-- ORDER:
-- 1) EXTENSIONS AND TYPES
-- 2) TABLES
-- 3) INDEXES
-- 4) RLS POLICIES
-- 5) FUNCTIONS
-- 6) TRIGGERS

-- ==============================================================
-- 1) EXTENSIONS AND TYPES
-- ==============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_mode') THEN
    CREATE TYPE public.chat_mode AS ENUM ('exam', 'explanation', 'summary');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
    CREATE TYPE public.message_status AS ENUM ('pending', 'completed', 'error');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
    CREATE TYPE public.document_status AS ENUM ('uploaded', 'processing', 'processed', 'error');
  END IF;
END
$$;

-- ==============================================================
-- 2) TABLES
-- ==============================================================

-- AUTH USERS TABLE IS PROVIDED BY SUPABASE: auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'NEW CHAT' CHECK (char_length(title) <= 160),
  mode public.chat_mode NOT NULL DEFAULT 'explanation',
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  message_count INTEGER NOT NULL DEFAULT 0 CHECK (message_count >= 0),
  total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role public.message_role NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  mode public.chat_mode NOT NULL DEFAULT 'explanation',
  provider TEXT NOT NULL DEFAULT 'groq',
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
  prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  status public.message_status NOT NULL DEFAULT 'completed',
  error_code TEXT,
  error_message TEXT,
  client_message_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_messages_conversation_client_id UNIQUE (conversation_id, client_message_id)
);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, usage_date)
);

CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'groq',
  model TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
  prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PHASE 2 SUPPORT: PDF/TEXT PROCESSING
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  extracted_text TEXT,
  summary TEXT,
  status public.document_status NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_documents_user_storage_path UNIQUE (user_id, storage_path)
);

-- EMAIL VERIFICATION TABLE FOR OTP
CREATE TABLE IF NOT EXISTS public.email_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL CHECK (char_length(otp_code) = 6),
  otp_hash TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  resend_count INTEGER NOT NULL DEFAULT 0 CHECK (resend_count >= 0),
  resend_last_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  attempt_last_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================
-- 3) INDEXES
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_conversations_user_recent
  ON public.conversations (user_id, last_message_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_user_mode
  ON public.conversations (user_id, mode);

CREATE INDEX IF NOT EXISTS idx_conversations_user_active_recent
  ON public.conversations (user_id, last_message_at DESC)
  WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_status_created
  ON public.messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_content_tsv
  ON public.messages
  USING GIN (to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_usage_tracking_date
  ON public.usage_tracking (usage_date);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_created
  ON public.usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_conversation_created
  ON public.usage_events (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_user_created
  ON public.documents (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_status_created
  ON public.documents (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_email
  ON public.email_verification (email);

CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at
  ON public.email_verification (expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verification_created
  ON public.email_verification (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_unverified_email
  ON public.email_verification (email)
  WHERE is_verified = FALSE;

-- ==============================================================
-- 4) RLS POLICIES
-- ==============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS conversations_select_own ON public.conversations;
CREATE POLICY conversations_select_own
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS conversations_delete_own ON public.conversations;
CREATE POLICY conversations_delete_own
  ON public.conversations
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS messages_select_own ON public.messages;
CREATE POLICY messages_select_own
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
CREATE POLICY messages_insert_own
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_update_own ON public.messages;
CREATE POLICY messages_update_own
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_delete_own ON public.messages;
CREATE POLICY messages_delete_own
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS usage_tracking_select_own ON public.usage_tracking;
CREATE POLICY usage_tracking_select_own
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_tracking_insert_own ON public.usage_tracking;
CREATE POLICY usage_tracking_insert_own
  ON public.usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_tracking_update_own ON public.usage_tracking;
CREATE POLICY usage_tracking_update_own
  ON public.usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_events_select_own ON public.usage_events;
CREATE POLICY usage_events_select_own
  ON public.usage_events
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_events_insert_own ON public.usage_events;
CREATE POLICY usage_events_insert_own
  ON public.usage_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_select_own ON public.documents;
CREATE POLICY documents_select_own
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_insert_own ON public.documents;
CREATE POLICY documents_insert_own
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_update_own ON public.documents;
CREATE POLICY documents_update_own
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS documents_delete_own ON public.documents;
CREATE POLICY documents_delete_own
  ON public.documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- EMAIL VERIFICATION POLICIES (ANON CAN INSERT/UPDATE)
DROP POLICY IF EXISTS email_verification_anon_insert ON public.email_verification;
CREATE POLICY email_verification_anon_insert
  ON public.email_verification
  FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS email_verification_anon_select ON public.email_verification;
CREATE POLICY email_verification_anon_select
  ON public.email_verification
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS email_verification_anon_update ON public.email_verification;
CREATE POLICY email_verification_anon_update
  ON public.email_verification
  FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- ==============================================================
-- 5) FUNCTIONS
-- ==============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_conversation_stats(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations c
  SET
    message_count = COALESCE(s.message_count, 0),
    total_tokens = COALESCE(s.total_tokens, 0),
    last_message_at = s.last_message_at,
    updated_at = NOW()
  FROM (
    SELECT
      COUNT(*)::INTEGER AS message_count,
      COALESCE(SUM(m.total_tokens), 0)::INTEGER AS total_tokens,
      MAX(m.created_at) AS last_message_at
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
  ) s
  WHERE c.id = p_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_message_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recompute_conversation_stats(NEW.conversation_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_conversation_stats(OLD.conversation_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM public.recompute_conversation_stats(NEW.conversation_id);
    IF OLD.conversation_id <> NEW.conversation_id THEN
      PERFORM public.recompute_conversation_stats(OLD.conversation_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_daily_limit_and_track(
  p_user_id UUID DEFAULT auth.uid(),
  p_prompt_tokens INTEGER DEFAULT 0,
  p_completion_tokens INTEGER DEFAULT 0,
  p_daily_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  allowed BOOLEAN,
  request_count INTEGER,
  remaining INTEGER,
  total_tokens INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_prompt_tokens INTEGER := GREATEST(COALESCE(p_prompt_tokens, 0), 0);
  v_completion_tokens INTEGER := GREATEST(COALESCE(p_completion_tokens, 0), 0);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USER ID IS REQUIRED';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_user_id THEN
    RAISE EXCEPTION 'NOT ALLOWED TO TRACK USAGE FOR ANOTHER USER';
  END IF;

  IF p_daily_limit < 1 THEN
    RAISE EXCEPTION 'DAILY LIMIT MUST BE GREATER THAN 0';
  END IF;

  INSERT INTO public.usage_tracking (user_id, usage_date)
  VALUES (v_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  UPDATE public.usage_tracking ut
  SET
    request_count = ut.request_count + 1,
    prompt_tokens = ut.prompt_tokens + v_prompt_tokens,
    completion_tokens = ut.completion_tokens + v_completion_tokens,
    last_request_at = NOW(),
    updated_at = NOW()
  WHERE ut.user_id = v_user_id
    AND ut.usage_date = CURRENT_DATE
    AND ut.request_count < p_daily_limit
  RETURNING
    TRUE,
    ut.request_count,
    GREATEST(p_daily_limit - ut.request_count, 0),
    ut.total_tokens
  INTO allowed, request_count, remaining, total_tokens;

  IF FOUND THEN
    RETURN NEXT;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    FALSE,
    ut.request_count,
    GREATEST(p_daily_limit - ut.request_count, 0),
    ut.total_tokens
  FROM public.usage_tracking ut
  WHERE ut.user_id = v_user_id
    AND ut.usage_date = CURRENT_DATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enforce_daily_limit_and_track(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.track_usage_tokens(
  p_user_id UUID DEFAULT auth.uid(),
  p_prompt_tokens INTEGER DEFAULT 0,
  p_completion_tokens INTEGER DEFAULT 0
)
RETURNS TABLE (
  request_count INTEGER,
  total_tokens INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_prompt_tokens INTEGER := GREATEST(COALESCE(p_prompt_tokens, 0), 0);
  v_completion_tokens INTEGER := GREATEST(COALESCE(p_completion_tokens, 0), 0);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USER ID IS REQUIRED';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> v_user_id THEN
    RAISE EXCEPTION 'NOT ALLOWED TO TRACK USAGE FOR ANOTHER USER';
  END IF;

  INSERT INTO public.usage_tracking (user_id, usage_date)
  VALUES (v_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  RETURN QUERY
  UPDATE public.usage_tracking ut
  SET
    prompt_tokens = ut.prompt_tokens + v_prompt_tokens,
    completion_tokens = ut.completion_tokens + v_completion_tokens,
    updated_at = NOW()
  WHERE ut.user_id = v_user_id
    AND ut.usage_date = CURRENT_DATE
  RETURNING ut.request_count, ut.total_tokens;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_usage_tokens(UUID, INTEGER, INTEGER) TO authenticated;

-- ==============================================================
-- EMAIL VERIFICATION FUNCTIONS
-- ==============================================================

CREATE OR REPLACE FUNCTION public.generate_otp_code()
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_otp TEXT;
BEGIN
  v_otp := LPAD(
    FLOOR(RANDOM() * 1000000)::TEXT,
    6,
    '0'
  );
  RETURN v_otp;
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_otp(p_otp TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN encode(
    digest(p_otp || 'bucura_ai_otp_salt', 'sha256'),
    'hex'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_email_verification(p_email TEXT)
RETURNS TABLE (
  id UUID,
  expires_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp TEXT;
  v_otp_hash TEXT;
  v_existing_record RECORD;
  v_expires_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Validate email
  IF p_email IS NULL OR p_email = '' OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RAISE EXCEPTION 'INVALID_EMAIL';
  END IF;

  -- Check if already verified
  IF EXISTS (
    SELECT 1 FROM public.email_verification
    WHERE email = p_email AND is_verified = TRUE
  ) THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_VERIFIED';
  END IF;

  -- Check rate limit (5 requests per hour)
  IF EXISTS (
    SELECT 1 FROM public.email_verification
    WHERE email = p_email
      AND created_at > v_now - INTERVAL '1 hour'
      AND resend_count >= 5
  ) THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;

  -- Check cooldown (60 seconds between resends)
  SELECT * INTO v_existing_record FROM public.email_verification
  WHERE email = p_email
    AND is_verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_record.resend_last_at > v_now - INTERVAL '60 seconds' THEN
      RAISE EXCEPTION 'RESEND_COOLDOWN_ACTIVE';
    END IF;
    IF v_existing_record.expires_at > v_now THEN
      RAISE EXCEPTION 'OTP_NOT_EXPIRED';
    END IF;
  END IF;

  -- Generate new OTP
  v_otp := public.generate_otp_code();
  v_otp_hash := public.hash_otp(v_otp);
  v_expires_at := v_now + INTERVAL '5 minutes';

  -- Delete old expired records for this email
  DELETE FROM public.email_verification
  WHERE email = p_email
    AND is_verified = FALSE
    AND expires_at < v_now;

  -- If valid record exists, update it
  IF FOUND THEN
    UPDATE public.email_verification
    SET
      otp_code = v_otp,
      otp_hash = v_otp_hash,
      resend_count = resend_count + 1,
      resend_last_at = v_now,
      attempt_count = 0,
      expires_at = v_expires_at,
      updated_at = v_now
    WHERE email = p_email AND is_verified = FALSE
    RETURNING id, expires_at, 'OTP_RESENT' INTO id, expires_at, message;
  ELSE
    -- Insert new OTP record
    INSERT INTO public.email_verification (
      email,
      otp_code,
      otp_hash,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      p_email,
      v_otp,
      v_otp_hash,
      v_expires_at,
      v_now,
      v_now
    )
    RETURNING
      public.email_verification.id,
      public.email_verification.expires_at,
      'OTP_CREATED' INTO id, expires_at, message;
  END IF;

  -- Note: Actual email sending happens via Supabase edge function
  RETURN NEXT;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_email_otp(p_email TEXT, p_otp TEXT)
RETURNS TABLE (
  success BOOLEAN,
  verified_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_otp_hash TEXT;
  v_record RECORD;
BEGIN
  v_otp_hash := public.hash_otp(p_otp);

  -- Validate inputs
  IF p_email IS NULL OR p_email = '' THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'INVALID_EMAIL'::TEXT;
    RETURN;
  END IF;

  IF p_otp IS NULL OR p_otp = '' OR char_length(trim(p_otp)) <> 6 THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'INVALID_OTP_FORMAT'::TEXT;
    RETURN;
  END IF;

  -- Fetch record
  SELECT * INTO v_record FROM public.email_verification
  WHERE email = p_email AND is_verified = FALSE;

  -- Check if record exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'NO_VERIFICATION_REQUEST'::TEXT;
    RETURN;
  END IF;

  -- Check if expired
  IF v_record.expires_at < v_now THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'OTP_EXPIRED'::TEXT;
    RETURN;
  END IF;

  -- Check attempt limit (5 attempts)
  IF v_record.attempt_count >= 5 THEN
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'MAX_ATTEMPTS_EXCEEDED'::TEXT;
    RETURN;
  END IF;

  -- Verify OTP hash
  IF v_record.otp_hash <> v_otp_hash THEN
    UPDATE public.email_verification
    SET
      attempt_count = attempt_count + 1,
      attempt_last_at = v_now,
      updated_at = v_now
    WHERE email = p_email AND is_verified = FALSE;
    
    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'INVALID_OTP'::TEXT;
    RETURN;
  END IF;

  -- Mark as verified
  UPDATE public.email_verification
  SET
    is_verified = TRUE,
    verified_at = v_now,
    updated_at = v_now
  WHERE email = p_email AND is_verified = FALSE
  RETURNING
    TRUE,
    public.email_verification.verified_at,
    'EMAIL_VERIFIED' INTO success, verified_at, message;

  RETURN NEXT;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_email_verified(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.email_verification
    WHERE email = p_email AND is_verified = TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_verification
  WHERE is_verified = FALSE
    AND expires_at < NOW() - INTERVAL '1 day';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_otp_code() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.hash_otp(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.request_email_verification(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_email_verified(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_verifications() TO service_role;

-- ==============================================================
-- 6) TRIGGERS
-- ==============================================================

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_set_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_set_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_messages_set_updated_at ON public.messages;
CREATE TRIGGER trg_messages_set_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_usage_tracking_set_updated_at ON public.usage_tracking;
CREATE TRIGGER trg_usage_tracking_set_updated_at
BEFORE UPDATE ON public.usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON public.documents;
CREATE TRIGGER trg_documents_set_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_email_verification_set_updated_at ON public.email_verification;
CREATE TRIGGER trg_email_verification_set_updated_at
BEFORE UPDATE ON public.email_verification
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

DROP TRIGGER IF EXISTS trg_messages_change ON public.messages;
CREATE TRIGGER trg_messages_change
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_message_change();
