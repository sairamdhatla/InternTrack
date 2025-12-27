-- Create table to store suggestion actions (dismissals, snoozes)
CREATE TABLE public.suggestion_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_key TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('dismissed', 'snoozed')),
  snooze_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, suggestion_key)
);

-- Enable RLS
ALTER TABLE public.suggestion_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own suggestion actions"
ON public.suggestion_actions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggestion actions"
ON public.suggestion_actions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestion actions"
ON public.suggestion_actions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestion actions"
ON public.suggestion_actions
FOR DELETE
USING (auth.uid() = user_id);