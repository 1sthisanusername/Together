import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVaultAuth, VaultPinPad, VaultView } from '@/features/vault';
import { LoadingState } from '@/shared/ui';
import { triggerHaptic } from '@/shared/theme';

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
    backgroundColor: '#FFF4E3',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2B2118',
    backgroundColor: '#FFF8EE',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B2118',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2B2118',
  },
  placeholder: {
    width: 60,
  },
});
