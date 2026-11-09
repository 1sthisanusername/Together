import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { triggerHaptic } from '@/shared/theme';

const VAULT_PIN_KEY = 'together_vault_pin';

export function useVaultAuth() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check whether PIN exists on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(VAULT_PIN_KEY);
        if (mounted) {
          setHasPin(!!stored);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setHasPin(false);
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-lock when app moves to background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        setIsUnlocked(false);
        setErrorMsg(null);
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync(VAULT_PIN_KEY);
      if (stored === pin) {
        setIsUnlocked(true);
        setErrorMsg(null);
        triggerHaptic('success');
        return true;
      } else {
        setErrorMsg('Incorrect PIN. Please try again.');
        triggerHaptic('error');
        return false;
      }
    } catch {
      setErrorMsg('Could not verify PIN.');
      triggerHaptic('error');
      return false;
    }
  }, []);

  const setupPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(VAULT_PIN_KEY, pin);
      setHasPin(true);
      setIsUnlocked(true);
      setErrorMsg(null);
      triggerHaptic('success');
      return true;
    } catch {
      setErrorMsg('Failed to save PIN.');
      triggerHaptic('error');
      return false;
    }
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setErrorMsg(null);
    triggerHaptic('medium');
  }, []);

  const resetPin = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(VAULT_PIN_KEY);
      setHasPin(false);
      setIsUnlocked(false);
      setErrorMsg(null);
    } catch {
      // Ignored
    }
  }, []);

  return {
    hasPin,
    isUnlocked,
    isLoading,
    errorMsg,
    verifyPin,
    setupPin,
    lock,
    resetPin,
  };
}

