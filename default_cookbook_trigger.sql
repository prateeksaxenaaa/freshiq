-- ========================================
-- Default Cookbook Trigger
-- ========================================
-- Automatically creates a "Dinner" cookbook when a new household is created.

CREATE OR REPLACE FUNCTION public.create_default_cookbook()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cookbooks (household_id, name, description)
  VALUES (NEW.id, 'Dinner', 'Default cookbook for main meals');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_household_created_default_cookbook ON public.households;

CREATE TRIGGER on_household_created_default_cookbook
AFTER INSERT ON public.households
FOR EACH ROW
EXECUTE FUNCTION public.create_default_cookbook();
