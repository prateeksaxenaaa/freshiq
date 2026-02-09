import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Database } from '../types/supabase';

// ------------------------------------------------------------------
// ENVIRONMENT VARIABLE VALIDATION
// ------------------------------------------------------------------
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
  console.error(
    `[Supabase] Invalid or Missing URL. Make sure EXPO_PUBLIC_SUPABASE_URL is set in your .env file.`
  );
  // Throwing here ensures the app fails fast if config is wrong
  throw new Error('Supabase Configuration Error: Missing EXPO_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  console.error(
    `[Supabase] Missing Anon Key. Make sure EXPO_PUBLIC_SUPABASE_ANON_KEY is set in your .env file.`
  );
  throw new Error('Supabase Configuration Error: Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// ------------------------------------------------------------------
// CLIENT INITIALIZATION
// ------------------------------------------------------------------
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
