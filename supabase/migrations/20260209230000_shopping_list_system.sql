-- Create shopping_list_items table if it doesn't exist or fix it
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit TEXT,
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_list_items
CREATE POLICY "Users can view their household shopping list"
ON public.shopping_list_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM household_members
        WHERE household_members.household_id = shopping_list_items.household_id
        AND household_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add items to their household shopping list"
ON public.shopping_list_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM household_members
        WHERE household_members.household_id = shopping_list_items.household_id
        AND household_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their household shopping list"
ON public.shopping_list_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM household_members
        WHERE household_members.household_id = shopping_list_items.household_id
        AND household_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete from their household shopping list"
ON public.shopping_list_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM household_members
        WHERE household_members.household_id = shopping_list_items.household_id
        AND household_members.user_id = auth.uid()
    )
);
