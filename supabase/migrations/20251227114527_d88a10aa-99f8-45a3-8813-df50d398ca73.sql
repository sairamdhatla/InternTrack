-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  smart_suggestions_enabled boolean NOT NULL DEFAULT true,
  follow_up_suggestions_enabled boolean NOT NULL DEFAULT true,
  insight_suggestions_enabled boolean NOT NULL DEFAULT true,
  career_insights_enabled boolean NOT NULL DEFAULT true,
  interview_reminders_enabled boolean NOT NULL DEFAULT true,
  deadline_reminders_enabled boolean NOT NULL DEFAULT true,
  inactivity_alerts_enabled boolean NOT NULL DEFAULT true,
  inactivity_alert_days integer NOT NULL DEFAULT 7,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();