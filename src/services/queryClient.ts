import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

const CACHE_STORAGE_KEY = 'together_query_cache_v1';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      gcTime: 1000 * 60 * 60 * 24, // 24 hours retained
    },
  },
});

/**
 * Restores persisted query cache from SecureStore for instant app reopen
 */
export async function restorePersistedCache(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(CACHE_STORAGE_KEY);
    if (raw) {
      const dehydratedState = JSON.parse(raw);
      hydrate(queryClient, dehydratedState);
    }
  } catch {
    // Non-fatal if cache missing or empty
  }
}

/**
 * Persists critical query cache entries (homeData, activeCouple, profile) to storage
 */
export async function persistQueryCache(): Promise<void> {
  try {
    const dehydrated = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) => {
        const key = query.queryKey[0];
        return (
          query.state.status === 'success' &&
          (key === 'homeData' || key === 'activeCouple' || key === 'profile')
        );
      },
    });
    await SecureStore.setItemAsync(CACHE_STORAGE_KEY, JSON.stringify(dehydrated));
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
    SecureStore.deleteItemAsync(CACHE_STORAGE_KEY).catch(() => {});
  } catch {
    // Ignore in non-native environments
  }
}
