import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVaultAuth, VaultPinPad, VaultView } from '@/features/vault';
import { LoadingState } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function VaultScreen() {
  const router = useRouter();
  const {
    hasPin,
    isUnlocked,
    isLoading,
    errorMsg,
    verifyPin,
    setupPin,
    lock,
  } = useVaultAuth();

  const handleBack = () => {
    triggerHaptic('light');
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Private Vault</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <LoadingState message="Checking vault security..." />
      ) : !hasPin ? (
        <VaultPinPad isSetup onSuccess={setupPin} error={errorMsg} />
      ) : !isUnlocked ? (
        <VaultPinPad isSetup={false} onSuccess={verifyPin} error={errorMsg} />
      ) : (
        <VaultView onLock={lock} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
  },
  backButton: {
    paddingVertical: scale(7),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.hardSm,
  },
  backButtonText: {
    fontSize: scale(13),
    fontWeight: '800',
    color: theme.colors.text,
  },
  navTitle: {
    fontSize: scale(18),
    fontWeight: '900',
    color: theme.colors.text,
  },
  placeholder: {
    width: scale(60),
  },
});

