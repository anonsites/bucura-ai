
-- UPDATED DATABASE SCRIPTS TO SUPPORT MULTIPLE WEBSITES CHATBOTS



-- ==============================================================
-- 1. UPDATE ENUMS & TYPES
-- ==============================================================

-- Add 'developer' to the existing user_role enum if it doesn't exist
-- Note: Postgres enums are immutable in some contexts, but adding values is generally safe.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'developer';

-- Add 'support' to chat_mode for customer service bots
ALTER TYPE public.chat_mode ADD VALUE IF NOT EXISTS 'support';


-- ==============================================================
-- 2. CREATE NEW TABLES (The Developer Platform)
-- ==============================================================

-- 2.1 WEBSITES (Tenants)
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 API KEYS (Secure access for widgets)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE DEFAULT ('sk_' || encode(gen_random_bytes(24), 'hex')), 
  name TEXT, -- e.g., "Production", "Staging"
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 CHATBOT CONFIGS (Behavior settings)
CREATE TABLE IF NOT EXISTS public.chatbot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL UNIQUE REFERENCES public.websites(id) ON DELETE CASCADE,
  system_prompt TEXT DEFAULT 'You are a helpful AI customer support agent.',
  model TEXT DEFAULT 'llama-3.1-8b-instant',
  temperature FLOAT DEFAULT 0.5,
  max_tokens INTEGER DEFAULT 500,
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 KNOWLEDGE BASE (RAG/Context)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================
-- 3. MODIFY EXISTING TABLES (Hybrid Support)
-- ==============================================================

-- 3.1 CONVERSATIONS
-- We need to allow conversations that belong to a Website (visitor) instead of a specific Auth User.
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_identifier TEXT, -- Session ID for anonymous visitors
  ALTER COLUMN user_id DROP NOT NULL; -- Make user_id nullable for anonymous chats

-- Add constraint: Must have EITHER user_id (Bucura User) OR website_id (Visitor)
ALTER TABLE public.conversations 
  ADD CONSTRAINT check_conversation_owner 
  CHECK (
    (user_id IS NOT NULL AND website_id IS NULL) OR 
    (user_id IS NULL AND website_id IS NOT NULL)
  );

-- 3.2 USAGE TRACKING
-- Update to track usage by website as well
ALTER TABLE public.usage_tracking
  DROP CONSTRAINT IF EXISTS usage_tracking_pkey; -- Drop old composite PK

ALTER TABLE public.usage_tracking
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Add proper ID
  ADD COLUMN IF NOT EXISTS website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  ALTER COLUMN user_id DROP NOT NULL;

-- Ensure we track either a user or a website
ALTER TABLE public.usage_tracking 
  ADD CONSTRAINT check_usage_owner 
  CHECK (
    (user_id IS NOT NULL AND website_id IS NULL) OR 
    (user_id IS NULL AND website_id IS NOT NULL)
  );


-- ==============================================================
-- 4. ENABLE RLS (Security)
-- ==============================================================

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 4.1 Policies for Websites
CREATE POLICY "Users can manage their own websites" ON public.websites
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 4.2 Policies for API Keys
CREATE POLICY "Users can manage keys for their websites" ON public.api_keys
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = api_keys.website_id AND w.owner_id = auth.uid()));

-- 4.3 Policies for Configs
CREATE POLICY "Users can manage configs for their websites" ON public.chatbot_configs
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = chatbot_configs.website_id AND w.owner_id = auth.uid()));

-- 4.4 Policies for Knowledge Base
CREATE POLICY "Users can manage knowledge base for their websites" ON public.knowledge_base
  USING (EXISTS (SELECT 1 FROM public.websites w WHERE w.id = knowledge_base.website_id AND w.owner_id = auth.uid()));

-- 4.5 Update Conversations Policy for Website Owners
-- Allow website owners to view conversations that happened on their websites
CREATE POLICY "Website owners can view visitor conversations" ON public.conversations
  FOR SELECT
  USING (
    website_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.websites w WHERE w.id = conversations.website_id AND w.owner_id = auth.uid())
  );

-- ==============================================================
-- 5. INDEXES (Performance)
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_conversations_website_id ON public.conversations(website_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_website_date ON public.usage_tracking(website_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(key);
