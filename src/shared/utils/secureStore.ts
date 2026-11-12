import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

/**
 * Universal cross-platform SecureStore wrapper.
 * - On Native (iOS/Android): Uses expo-secure-store hardware-backed keychain/keystore.
 * - On Web: Gracefully falls back to window.localStorage with an identical async API,
 *   preventing "ExpoSecureStore.default.setValueWithKeyAsync is not a function" crashes.
 */
export const safeSecureStore = {
  async isAvailableAsync(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }
    try {
      return await ExpoSecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async getItemAsync(
    key: string,
    options?: ExpoSecureStore.SecureStoreOptions
  ): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return ExpoSecureStore.getItemAsync(key, options);
  },

  async setItemAsync(
    key: string,
    value: string,
    options?: ExpoSecureStore.SecureStoreOptions
  ): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return ExpoSecureStore.setItemAsync(key, value, options);
  },

  async deleteItemAsync(
    key: string,
    options?: ExpoSecureStore.SecureStoreOptions
  ): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return ExpoSecureStore.deleteItemAsync(key, options);
  },
};

export default safeSecureStore;

