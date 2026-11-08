import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsView } from '@/features/settings';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backText} maxFontSizeMultiplier={1.35}>
            ← {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title} maxFontSizeMultiplier={1.35}>
          {t('settings.title')}
        </Text>
        <View style={styles.spacer} />
      </View>
      <SettingsView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(8),
    minHeight: 36,
    justifyContent: 'center',
  },
  backText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  title: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  spacer: {
    width: scale(60),
  },
});
