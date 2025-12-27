-- Create internships table
CREATE TABLE public.internships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Applied',
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own internships"
ON public.internships
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own internships"
ON public.internships
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own internships"
ON public.internships
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own internships"
ON public.internships
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_internships_updated_at
BEFORE UPDATE ON public.internships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();