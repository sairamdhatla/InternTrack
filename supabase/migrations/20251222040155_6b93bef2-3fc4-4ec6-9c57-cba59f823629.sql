-- Create enum for plan types
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- Create enum for billing cycle
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'yearly');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  billing_cycle billing_cycle,
  status subscription_status NOT NULL DEFAULT 'active',
  razorpay_subscription_id TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own subscription (for free plan creation)
CREATE POLICY "Users can create their own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update subscriptions (for webhook processing)
CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();