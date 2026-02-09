# FreshIQ Project Setup Walkthrough

## Project Structure
The project is set up using **Expo Managed Workflow** with **TypeScript** and **Expo Router**.

### Key Directories
- **`/app`**: Contains all screens and routing logic files. This is the heart of Expo Router.
- **`/components`**: Reusable UI components (buttons, cards, etc.).
- **`/services`**: Place for API calls and complex business logic (e.g., fetching data from Supabase).
- **`/lib`**: Helper libraries. currently contains `supabase.ts` which exports the initialized Supabase client.
- **`/hooks`**: Custom React hooks for sharing logic between components.
- **`/constants`**: Global configuration values like colors, layout dimensions, etc.

## Setup Instructions

### 1. Environment Variables
Rename `.env.example` to `.env` and fill in your Supabase details:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. Google Sign-In
Dependencies (`expo-auth-session`, `expo-crypto`) are installed. To implement the auth flow:
1. Configure a Google Cloud project.
2. Add the proper URI schemes to `app.json` (scheme: "freshiq").
3. Use `Google.useAuthRequest` in your login screen.

### 3. Running the App
```bash
npx expo start
```

## Setup Verification
- [x] Project initialized with TypeScript
- [x] Supabase client configured in `/lib/supabase.ts`
- [x] Dependencies installed including `react-native-url-polyfill` and `expo-auth-session`
- [x] Folder structure enforced
