-- Create application_notes table
CREATE TABLE public.application_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notes"
ON public.application_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
ON public.application_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies since notes are immutable

-- Add index for faster queries
CREATE INDEX idx_application_notes_application_id ON public.application_notes(application_id);
CREATE INDEX idx_application_notes_user_id ON public.application_notes(user_id);