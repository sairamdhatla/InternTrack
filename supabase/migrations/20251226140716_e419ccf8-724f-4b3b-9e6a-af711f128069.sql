-- Add deadline and reminder columns to applications table
ALTER TABLE public.applications 
ADD COLUMN deadline_date date,
ADD COLUMN reminder_enabled boolean NOT NULL DEFAULT false;