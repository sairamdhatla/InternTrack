-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note TEXT,
  followed_up_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own follow-ups"
ON public.follow_ups
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow-ups"
ON public.follow_ups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow-ups"
ON public.follow_ups
FOR DELETE
USING (auth.uid() = user_id);