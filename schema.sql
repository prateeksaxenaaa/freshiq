-- FreshIQ Database Schema
-- Run this entire script in the Supabase SQL Editor

-- 1. Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean up (Optional - uncomment to reset)
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;
-- DROP TABLE IF EXISTS public.recipe_imports CASCADE;
-- DROP TABLE IF EXISTS public.shopping_list_items CASCADE;
-- DROP TABLE IF EXISTS public.shopping_lists CASCADE;
-- DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
-- DROP TABLE IF EXISTS public.recipe_steps CASCADE;
-- DROP TABLE IF EXISTS public.recipes CASCADE;
-- DROP TABLE IF EXISTS public.cookbooks CASCADE;
-- DROP TABLE IF EXISTS public.inventory_activity_log CASCADE;
-- DROP TABLE IF EXISTS public.inventory_items CASCADE;
-- DROP TABLE IF EXISTS public.storage_locations CASCADE;
-- DROP TABLE IF EXISTS public.household_members CASCADE;
-- DROP TABLE IF EXISTS public.households CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TYPE IF EXISTS member_role CASCADE;

-- 3. Core Identity & Access

-- Users (Public Profile linked to Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households (Shared Scope)
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household Members (Access Control)
CREATE TYPE member_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TABLE public.household_members (
  user_id UUID REFERENCES public.profiles(id),
  household_id UUID REFERENCES public.households(id),
  role member_role DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, household_id)
);

-- 4. Inventory System

-- Storage Locations
CREATE TABLE public.storage_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('fridge', 'freezer', 'pantry', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  storage_location_id UUID REFERENCES public.storage_locations(id),
  
  -- Item Details
  name TEXT NOT NULL,
  barcode TEXT,
  
  -- Quantity & Trust
  quantity NUMERIC NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL,
  is_loose_unit BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0.0 AND 1.0) DEFAULT 1.0,
  
  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  predicted_empty_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Activity Log
CREATE TABLE public.inventory_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  household_id UUID REFERENCES public.households(id),
  user_id UUID REFERENCES public.profiles(id),
  action_type TEXT NOT NULL, -- 'cook', 'scan_in', 'manual_adjust', 'throw_out', 'decay'
  quantity_delta NUMERIC,
  confidence_delta FLOAT,
  full_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Recipe Management

-- Cookbooks
CREATE TABLE public.cookbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id),
  title TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  source_url TEXT,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Steps
CREATE TABLE public.recipe_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  section_label TEXT
);

-- Recipe Ingredients
CREATE TABLE public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  name TEXT,
  quantity NUMERIC,
  unit TEXT
);

-- Recipe Imports
CREATE TABLE public.recipe_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  source_type TEXT CHECK (source_type IN ('url', 'image', 'text')),
  content_payload TEXT,
  status TEXT DEFAULT 'pending',
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shopping Lists

-- Shopping Lists
CREATE TABLE public.shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id),
  name TEXT NOT NULL DEFAULT 'My Shopping List',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping List Items
CREATE TABLE public.shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Future Features

-- Subscriptions / Premium Flags
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE,
  tier TEXT DEFAULT 'free',
  valid_until TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS) on all tables
-- This blocks all access by default until policies are created.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: RLS Policies need to be defined separately to allow access. 
-- For initial setup, you might want to create a policy allowing all authenticated users to insert their own profile, etc.
