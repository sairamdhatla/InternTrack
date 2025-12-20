-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-documents', 'application-documents', false);

-- Create table to track file attachments
CREATE TABLE public.application_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on application_files
ALTER TABLE public.application_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own files
CREATE POLICY "Users can view their own files"
ON public.application_files
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own files
CREATE POLICY "Users can insert their own files"
ON public.application_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON public.application_files
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for application-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'application-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);