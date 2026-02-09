-- Function to ensure default storage locations exist for a household
CREATE OR REPLACE FUNCTION public.ensure_default_storage_locations(h_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.storage_locations (household_id, name, type)
    VALUES 
        (h_id, 'Fridge', 'fridge'),
        (h_id, 'Freezer', 'freezer'),
        (h_id, 'Pantry', 'pantry')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default storage locations for new households
CREATE OR REPLACE FUNCTION public.on_household_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.ensure_default_storage_locations(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_on_household_created ON public.households;
CREATE TRIGGER trigger_on_household_created
AFTER INSERT ON public.households
FOR EACH ROW EXECUTE FUNCTION public.on_household_created();

-- Ensure defaults for existing households (run once)
DO $$
DECLARE
    h RECORD;
BEGIN
    FOR h IN SELECT id FROM public.households LOOP
        PERFORM public.ensure_default_storage_locations(h.id);
    END LOOP;
END;
$$;
