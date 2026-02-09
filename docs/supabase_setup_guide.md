# Supabase Setup & Architecture Guide

## 1. Create Supabase Project
1. Go to [database.new](https://database.new) and create a new project.
2. Name it **FreshIQ**.
3. Set a strong database password (store this securely).
4. Select a region close to your target audience (US).
5. Wait for the database to provision.

## 2. Google OAuth Configuration

### A. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project **FreshIQ-Mobile**.
3. Navigate to **APIs & Services > OAuth consent screen**.
   - User Type: **External**.
   - Fill in app name, support email, etc.
4. Navigate to **Credentials**.
   - Create Credentials > **OAuth client ID**.
   - Application type: **Web application** (Supabase handles the mobile redirect).
   - **Authorized JavaScript origins**: `https://<PROJECT_REF>.supabase.co`
   - **Authorized redirect URIs**: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**.

### B. Supabase Dashboard
1. Go to **Authentication > Providers > Google**.
2. Enable **Providier Enabled**.
3. Paste the **Client ID** and **Client Secret**.
4. Click **Save**.

### C. Expo Redirect Configuration
For the mobile app to handle the redirect properly:
1. In Supabase Dashboard, go to **Authentication > URL Configuration**.
2. Add the following to **Redirect URLs**:
   - `exp://localhost:8081` (for local development)
   - `freshiq://` (for production/development builds)
   - `freshiq://google-auth` (specific path if needed)

## 3. High-Level Database Architecture
*No SQL implemented yet. This is the entity strategy:*

### Core Entities
- **Users (`public.profiles`)**
  - Links to `auth.users` (1:1).
  - Stores: display name, avatar, preferences.

- **Households (`public.households`)**
  - Shared space for inventory/lists.
  - Users can belong to one or many households.

- **Household Members (`public.household_members`)**
  - Join table (User <-> Household).
  - Roles: Admin, Editor, Viewer.

- **Inventory (`public.inventory_items`)**
  - Tracks food items in a household.
  - Fields: name, quantity, expiry_date, category, location (fridge/pantry).

- **Recipes (`public.recipes`)**
  - Title, description, instructions.
  - Can be public (global) or private (household specific).

- **Shopping Lists (`public.shopping_list_items`)**
  - Items to buy.
  - Linked to a Household.

## 4. Next Steps
- Update your local `.env` file with the new Supabase URL and Anon Key.
