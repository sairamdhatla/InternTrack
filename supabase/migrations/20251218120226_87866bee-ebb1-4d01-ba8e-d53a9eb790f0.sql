-- Create application_events table for immutable event logging
CREATE TABLE public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own events
CREATE POLICY "Users can view their own events"
ON public.application_events
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own events
CREATE POLICY "Users can insert their own events"
ON public.application_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No update or delete - events are immutable

-- Index for faster queries
CREATE INDEX idx_application_events_application_id ON public.application_events(application_id);
CREATE INDEX idx_application_events_user_id ON public.application_events(user_id);