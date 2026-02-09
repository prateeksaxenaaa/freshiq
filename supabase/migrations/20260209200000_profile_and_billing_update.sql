-- Migration: Update Profiles and add Billing History
-- 1. Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Generate default usernames for existing users (based on email)
UPDATE public.profiles
SET username = LOWER(SPLIT_PART(email, '@', 1)) || '_' || SUBSTRING(id::text, 1, 4)
WHERE username IS NULL;

-- 3. Create Billing History Table
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    invoice_url TEXT,
    billing_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on Billing History
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Billing History
CREATE POLICY "Users can view their own billing history" 
ON public.billing_history FOR SELECT 
USING (auth.uid() = user_id);

-- 6. RLS Policies for Profiles (Update)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
