-- Create profiles table for public sharing
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  public_profile_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Anyone can view public profiles (for share page)
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
USING (public_profile_enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer function for public profile data access
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_username text)
RETURNS TABLE (
  display_name text,
  total_applications bigint,
  interviews bigint,
  offers bigint,
  applications json
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  profile_user_id uuid;
  profile_display_name text;
BEGIN
  -- Get profile and verify it's public
  SELECT p.id, p.display_name INTO profile_user_id, profile_display_name
  FROM public.profiles p
  WHERE p.username = profile_username AND p.public_profile_enabled = true;
  
  IF profile_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    profile_display_name,
    (SELECT COUNT(*) FROM public.applications WHERE user_id = profile_user_id)::bigint,
    (SELECT COUNT(*) FROM public.applications WHERE user_id = profile_user_id AND status = 'Interview')::bigint,
    (SELECT COUNT(*) FROM public.applications WHERE user_id = profile_user_id AND status = 'Offer')::bigint,
    (SELECT json_agg(json_build_object(
      'company', a.company,
      'role', a.role,
      'status', a.status
    ) ORDER BY a.applied_date DESC)
    FROM public.applications a
    WHERE a.user_id = profile_user_id)::json;
END;
$$;