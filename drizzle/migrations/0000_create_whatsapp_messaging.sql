CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_name text NOT NULL,
  phone_number text NOT NULL,
  avatar_initials text NOT NULL DEFAULT 'WA',
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own WhatsApp conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own WhatsApp conversations" ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own WhatsApp conversations" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own WhatsApp conversations" ON public.whatsapp_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  provider_message_id text,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type text NOT NULL DEFAULT 'text',
  recipient_phone text NOT NULL,
  body text,
  media_url text,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending','sent','delivered','read','failed')),
  error_reason text,
  provider_timestamp timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own WhatsApp messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own WhatsApp messages" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own WhatsApp messages" ON public.whatsapp_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own WhatsApp messages" ON public.whatsapp_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX whatsapp_messages_provider_message_id_idx ON public.whatsapp_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX whatsapp_messages_conversation_created_idx ON public.whatsapp_messages(conversation_id, created_at);

CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.whatsapp_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  recipient_phone text,
  message_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.whatsapp_audit_logs TO authenticated;
GRANT ALL ON public.whatsapp_audit_logs TO service_role;
ALTER TABLE public.whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own WhatsApp audit logs" ON public.whatsapp_audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own WhatsApp audit logs" ON public.whatsapp_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX whatsapp_conversations_user_updated_idx ON public.whatsapp_conversations(user_id, updated_at DESC);
CREATE INDEX whatsapp_audit_logs_user_created_idx ON public.whatsapp_audit_logs(user_id, created_at DESC);