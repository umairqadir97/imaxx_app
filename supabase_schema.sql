-- ====================================================================
-- iMaxx App - Supabase Database Schema Migration
-- Creates profiles, subscriptions, and user_stats tables in public schema
-- ====================================================================

-- 1. DROP EXISTING TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. DROP EXISTING TABLES
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ====================================================================
-- 3. CREATE PROFILES TABLE (in public schema)
-- Stores comprehensive user profile, payment_plan, and premium state
-- ====================================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  payment_plan TEXT DEFAULT 'free' CHECK (payment_plan IN ('free', 'monthly_pass', 'annual_ultra', '7day_trial')),
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'trialing', 'canceled', 'expired')),
  is_premium BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow individual update access to own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Allow service role full access to profiles" 
  ON public.profiles FOR ALL 
  USING (true);

-- ====================================================================
-- 4. CREATE SUBSCRIPTIONS TABLE
-- ====================================================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('active', 'trialing', 'canceled', 'expired', 'free')),
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('monthly_pass', 'annual_ultra', 'free')),
  store TEXT DEFAULT 'test_revenuecat' CHECK (store IN ('app_store', 'play_store', 'web_stripe', 'test_revenuecat', 'free')),
  revenuecat_customer_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_trial_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (true);

CREATE POLICY "Allow service role full access to subscriptions" 
  ON public.subscriptions FOR ALL 
  USING (true);

-- ====================================================================
-- 5. CREATE USER STATS TABLE (Focus & Sleep Tracking Data)
-- ====================================================================
CREATE TABLE public.user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_focus_seconds INTEGER DEFAULT 0,
  completed_pomodoros INTEGER DEFAULT 0,
  weekly_focus_minutes JSONB DEFAULT '[0, 0, 0, 0, 0, 0, 0]'::jsonb,
  category_focus_seconds JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select for user_stats" 
  ON public.user_stats FOR SELECT 
  USING (true);

CREATE POLICY "Allow service role full access to user_stats" 
  ON public.user_stats FOR ALL 
  USING (true);

-- ====================================================================
-- 6. AUTOMATIC NEW USER REGISTRATION TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, payment_plan, subscription_status, is_premium)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'payment_plan', 'free'),
    COALESCE(NEW.raw_user_meta_data->>'subscription_status', 'free'),
    COALESCE((NEW.raw_user_meta_data->>'is_premium')::boolean, false)
  );

  -- Insert default free subscription
  INSERT INTO public.subscriptions (user_id, status, plan_type, store)
  VALUES (
    NEW.id,
    'free',
    'free',
    'free'
  );

  -- Insert initial stats record
  INSERT INTO public.user_stats (user_id, total_focus_seconds, completed_pomodoros)
  VALUES (
    NEW.id,
    0,
    0
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
