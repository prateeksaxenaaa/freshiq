-- FIXED AUTH TRIGGERS
-- Run this entire script in the Supabase SQL Editor to fix the missing profile issue.

-- 1. DROP EXISTING TRIGGER/FUNCTION TO ENSURE CLEAN UPDATE
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. CREATE THE ROBUST FUNCTION
create or replace function public.handle_new_user() 
returns trigger as $$
declare
  new_household_id uuid;
  user_display_name text;
begin
  -- Resolve Display Name: Try 'full_name', then 'name', then fallback to Email part
  user_display_name := coalesce(
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'name', 
    split_part(new.email, '@', 1)
  );

  -- A. Create a public profile (Idempotent: do nothing if already exists)
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id, 
    new.email, 
    user_display_name,
    new.raw_user_meta_data->>'avatar_url' -- Google provides this key usually
  )
  on conflict (id) do nothing;

  -- B. Create a default Household (if not already member of one - simplified check)
  -- For a fresh signup, they won't be a member. 
  insert into public.households (name, created_by)
  values (
    user_display_name || '''s Household', 
    new.id
  )
  returning id into new_household_id;

  -- C. Add user as Admin
  insert into public.household_members (user_id, household_id, role)
  values (new.id, new_household_id, 'admin');

  return new;
end;
$$ language plpgsql security definer;

-- 3. RE-CREATE THE TRIGGER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. BACKFILL FOR EXITING USERS (Optional but recommended for your testing)
-- This tries to create profiles for any user in auth.users who DOES NOT have a profile yet.
do $$
declare user_record record;
begin
  for user_record in select * from auth.users where id not in (select id from public.profiles) loop
    -- Manually call the logic (simplified for backfill)
    insert into public.profiles (id, email, display_name, avatar_url)
    values (
      user_record.id, 
      user_record.email, 
      coalesce(user_record.raw_user_meta_data->>'full_name', user_record.raw_user_meta_data->>'name', split_part(user_record.email, '@', 1)),
      user_record.raw_user_meta_data->>'avatar_url'
    );
  end loop;
end;
$$;
