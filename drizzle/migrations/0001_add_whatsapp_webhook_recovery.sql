ALTER TABLE public.whatsapp_webhook_events ADD COLUMN attempt_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.whatsapp_webhook_events ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX whatsapp_webhook_events_recovery_idx ON public.whatsapp_webhook_events(processed_at, next_attempt_at, received_at);