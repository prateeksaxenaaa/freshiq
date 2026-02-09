-- FreshIQ Auth Triggers
-- Run this script in the Supabase SQL Editor AFTER the schema.sql script

-- 1. Create the Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_household_id uuid;
begin
  -- A. Create a public profile for the user
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );

  -- B. Create a default Household for the user
  -- Naming logic: Use metadata name or fallback to "My"
  insert into public.households (name, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', 'My') || '''s Household', 
    new.id
  )
  returning id into new_household_id;

  -- C. Add the user as an Admin of their new household
  insert into public.household_members (user_id, household_id, role)
  values (new.id, new_household_id, 'admin');

  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the Trigger
-- This triggers purely on the `auth.users` table (Supabase internal)
-- Drop if exists to avoid errors on re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Security Note
-- The function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres/admin).
-- This is necessary to bypass RLS/Permissions during the initial signup phase when the user might not have rights yet.
