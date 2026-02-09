-- 1. Feature Requests Table
CREATE TABLE IF NOT EXISTS public.feature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'implementing', 'implemented')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Upvotes Table
CREATE TABLE IF NOT EXISTS public.feature_upvotes (
    feature_id UUID REFERENCES public.feature_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (feature_id, user_id)
);

-- 3. Real-time upvote count helper view
CREATE OR REPLACE VIEW public.feature_requests_with_votes AS
SELECT 
    fr.id,
    fr.title,
    fr.description,
    fr.status,
    fr.created_at,
    fr.updated_at,
    COUNT(fu.user_id)::int as upvote_count
FROM public.feature_requests fr
LEFT JOIN public.feature_upvotes fu ON fr.id = fu.feature_id
GROUP BY fr.id;

-- RLS Policies
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_upvotes ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view feature requests
CREATE POLICY "Public read for features" ON public.feature_requests
FOR SELECT USING (true);

-- 2. Users can view all upvotes
CREATE POLICY "Public read for upvotes" ON public.feature_upvotes
FOR SELECT USING (true);

-- 3. Users can toggle their own upvotes
CREATE POLICY "Users can insert their own upvotes" ON public.feature_upvotes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes" ON public.feature_upvotes
FOR DELETE USING (auth.uid() = user_id);

-- Insert some starter features for demo
INSERT INTO public.feature_requests (title, description, status) VALUES
('Dark Mode', 'Full dark mode support across the entire app for eye comfort at night.', 'open'),
('Voice Control', 'Add voice commands to start timers, read steps, or add items to inventory while your hands are busy cooking.', 'open'),
('Offline Mode', 'Access your cookbook and meal plans even without an internet connection.', 'open'),
('Grocery Store Integration', 'Automatically send your shopping list to apps like Instacart or Walmart.', 'open'),
('Meal Planning Calendar', 'Allow users to drag and drop recipes into a weekly meal planning calendar.', 'implementing'),
('Smart Grocery List', 'Automatically group ingredients from your inventory and recipes into a shopping list.', 'implemented');
