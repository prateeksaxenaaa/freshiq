# FreshIQ Database Schema Design

## Overview
This schema is designed for Supabase (PostgreSQL). It prioritizes **data integrity** for shared households and **flexibility** for the "no scan-out" inventory model.

### Key Concepts
- **Loose Inventory**: `inventory_items` supports both exact quantities vs loose labels (e.g., "approx 50% full").
- **Probability Engine**: Inventory items have a `confidence_score` that decays over time or usage.
- **Shared Access**: All core data is rooted in `households`, not just individual users.

---

## 1. SQL Table Definitions

### Core Identity & Access

```sql
-- 1. Users (Public Profile linked to Auth)
-- Why: Stores app-specific user data separate from Supabase Auth.
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Households (Shared Scope)
-- Why: The central container for all shared data.
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Household Members (Access Control)
-- Why: Many-to-Many link between Users and Households.
CREATE TYPE member_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TABLE public.household_members (
  user_id UUID REFERENCES public.profiles(id),
  household_id UUID REFERENCES public.households(id),
  role member_role DEFAULT 'editor',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, household_id)
);
```

### Inventory System

```sql
-- 4. Storage Locations
-- Why: Physical places where food is kept.
CREATE TABLE public.storage_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  name TEXT NOT NULL, -- e.g., "Main Fridge", "Basement Freezer"
  type TEXT CHECK (type IN ('fridge', 'freezer', 'pantry', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Items (The Core "Smart" Table)
-- Why: Tracks what users have. Supports loose units and probability.
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) NOT NULL,
  storage_location_id UUID REFERENCES public.storage_locations(id),
  
  -- Item Details
  name TEXT NOT NULL,
  barcode TEXT, -- Optional, for scanning in
  
  -- Quantity & Trust
  quantity NUMERIC NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL, -- e.g., "kg", "pcs", "bottle" (standardized)
  is_loose_unit BOOLEAN DEFAULT FALSE, -- If true, quantity is an approximation
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0.0 AND 1.0) DEFAULT 1.0,
  
  -- Dates
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  predicted_empty_date TIMESTAMPTZ, -- AI estimated
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Activity Log
-- Why: Critical for AI training and debugging "magic" adjustments.
CREATE TABLE public.inventory_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  household_id UUID REFERENCES public.households(id),
  user_id UUID REFERENCES public.profiles(id), -- Nullable if system action
  action_type TEXT NOT NULL, -- 'cook', 'scan_in', 'manual_adjust', 'throw_out', 'decay'
  quantity_delta NUMERIC,
  confidence_delta FLOAT,
  full_snapshot JSONB, -- State of item after change
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Recipe Management

```sql
-- 7. Cookbooks
-- Why: User-defined collections of recipes.
CREATE TABLE public.cookbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id), -- If null, personal? Or enforce household?
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Recipes
-- Why: The cooking instructions and metadata.
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
  is_verified BOOLEAN DEFAULT FALSE, -- For "Official FreshIQ" recipes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Recipe Steps
-- Why: Step-by-step instructions.
CREATE TABLE public.recipe_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT NOT NULL,
  section_label TEXT -- e.g., "For the Sauce"
);

-- 10. Recipe Ingredients
-- Why: Structured data for matching against inventory.
CREATE TABLE public.recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL, -- "2 large onions, diced"
  name TEXT, -- "onion" (parsed)
  quantity NUMERIC, -- 2.0 (parsed)
  unit TEXT -- "count" (parsed)
);

-- 13. Recipe Imports
-- Why: Staging area for parsed content before converting to full recipe.
CREATE TABLE public.recipe_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  source_type TEXT CHECK (source_type IN ('url', 'image', 'text')),
  content_payload TEXT, -- The raw link or OCR text
  status TEXT DEFAULT 'pending', -- 'processing', 'completed', 'failed'
  parsed_data JSONB, -- The AI result
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Shopping

```sql
-- 11. Shopping Lists
-- Why: Grouping items to buy.
CREATE TABLE public.shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id),
  name TEXT NOT NULL DEFAULT 'My Shopping List',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Shopping List Items
-- Why: Items to buy.
CREATE TABLE public.shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  category TEXT, -- e.g., "Produce" (for sorting)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Future Features

```sql
-- 14. Subscriptions / Premium Flags
-- Why: Access control for premium features (AI analysis, unlimited storage).
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE,
  tier TEXT DEFAULT 'free', -- 'pro', 'family'
  valid_until TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Logic & Algorithms

### Probability & Confidence Calculation
We address the "No Mandatory Scan-Out" rule using a `confidence_score` (0-1).

1.  **Initial State**:
    *   Item added (Scan In) -> `confidence_score = 1.0`.

2.  **Decay Over Time**:
    *   Every night, a cloud function runs.
    *   If `expiry_date` is approaching, `confidence` drops slightly (users might check less).
    *   If item is perishable (produce) and > 7 days old, `confidence *= 0.9`.

3.  **Cooking Actions**:
    *   User selects "Cook Recipe X".
    *   App checks ingredients.
    *   **Scenario A (Exact Match)**: We have 2 onions, recipe needs 2. `quantity` -> 0, `confidence` -> 1.0 (empty).
    *   **Scenario B (Fuzzy Match)**: We have "some milk", recipe needs "1 cup".
        *   We do NOT reduce quantity (hard to map "some" to "cups" accurately without user input).
        *   Instead, we reduce `confidence`.
        *   `confidence *= 0.8` (We are less sure users still have "some" milk).

### Inventory "Ghost" State
When `confidence_score` drops below `0.3`, the item is flagged as "Likely Empty".
*   It still appears in searches but with a specific UI (greyed out / "Do you still have this?").
*   One-tap action: "Yes" (Resets confidence to 1.0) or "No" (Deletes item).

## 3. Scalability Notes
*   **Partitioning**: If `inventory_activity_log` grows huge, partition by `created_at` (monthly).
*   **Indexes**:
    *   `inventory_items(household_id, storage_location_id)`: Frequent filter.
    *   `recipe_ingredients(name)`: For fuzzy searching ingredients.
*   **Vector Search**: For finding recipes by ingredients, we will eventually enable `pgvector` on `recipes.description` or `recipe_ingredients` to allow semantic search ("I have chicken and rice, what can I make?").
