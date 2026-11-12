import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { safeSecureStore as SecureStore } from '@/shared/utils';

const CACHE_STORAGE_KEY = 'together_query_cache_v2';
const CACHE_FILE_PATH = `${FileSystem.documentDirectory || ''}together_query_cache.json`;

const CACHED_QUERY_KEYS = new Set([
  'homeData',
  'activeCouple',
  'profile',
  'userSettings',
  'daily_question',
  'messages',
  'letters',
  'memories',
  'reunions',
  'importantDates',
  'bucketItems',
  'notifications',
  'activities',
  'vault_items',
]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 30, // 30 minutes fresh in local memory/storage unless invalidated by targeted Realtime/mutation
      gcTime: 1000 * 60 * 60 * 24, // 24 hours retained
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

let persistTimer: ReturnType<typeof setTimeout> | null = null;
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event.action?.type === 'success') {
    const key = String(event.query.queryKey[0]);
    if (!CACHED_QUERY_KEYS.has(key)) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistQueryCache().catch(() => {});
    }, 1500);
  }
});

/**
 * Restores persisted query cache for instant offline cold start
 */
export async function restorePersistedCache(): Promise<void> {
  try {
    let raw: string | null = null;
    // 1. Try reading from FileSystem
    if (FileSystem.documentDirectory) {
      const info = await FileSystem.getInfoAsync(CACHE_FILE_PATH);
      if (info.exists) {
        raw = await FileSystem.readAsStringAsync(CACHE_FILE_PATH);
      }
    }
    // 2. Fallback to SecureStore
    if (!raw) {
      raw = await SecureStore.getItemAsync(CACHE_STORAGE_KEY);
    }

    if (raw) {
      const dehydratedState = JSON.parse(raw);
      hydrate(queryClient, dehydratedState);
    }
  } catch {
    // Non-fatal if cache missing or empty
  }
}

/**
 * Persists critical query cache entries to storage for offline availability
 */
export async function persistQueryCache(): Promise<void> {
  try {
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        const key = String(query.queryKey[0]);
        return (
          query.state.status === 'success' && CACHED_QUERY_KEYS.has(key)
        );
      },
    });
    const serialized = JSON.stringify(dehydrated);

    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(CACHE_FILE_PATH, serialized);
    } else {
      await SecureStore.setItemAsync(CACHE_STORAGE_KEY, serialized);
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Clears both in-memory queries and persisted storage cache on sign out
 */
export function clearAppCache(): void {
  queryClient.clear();
  try {
    if (FileSystem.documentDirectory) {
      FileSystem.deleteAsync(CACHE_FILE_PATH, { idempotent: true }).catch(() => {});
    }
    SecureStore.deleteItemAsync(CACHE_STORAGE_KEY).catch(() => {});
  } catch {
    // Ignore in non-native environments
  }
}
