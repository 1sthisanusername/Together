import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { safeSecureStore } from '@/shared/utils';
import type { Database } from '@/shared/types/database.types';

// Custom storage adapter for React Native using safe cross-platform SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => safeSecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => safeSecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => safeSecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

