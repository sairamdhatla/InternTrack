-- Drop the existing constraint and add an updated one with all valid notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('interview_reminder', 'inactivity_alert', 'deadline_today', 'deadline_tomorrow', 'follow_up_due', 'weekly_summary'));