ALTER TABLE public.whatsapp_messages ADD COLUMN client_request_id uuid;
ALTER TABLE public.whatsapp_messages ADD COLUMN delivery_attempted_at timestamptz;
CREATE UNIQUE INDEX whatsapp_messages_user_client_request_idx ON public.whatsapp_messages(user_id, client_request_id) WHERE client_request_id IS NOT NULL;
CREATE UNIQUE INDEX whatsapp_conversations_phone_number_idx ON public.whatsapp_conversations(phone_number);
CREATE INDEX whatsapp_webhook_events_event_received_idx ON public.whatsapp_webhook_events(event, received_at DESC);