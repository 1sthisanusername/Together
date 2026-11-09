import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemories, MemoryCard, AddMemoryModal } from '@/features/memories';
import { LoadingState, ErrorState, Button, EmptyState, SwipeTabWrapper } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function MemoriesScreen() {
  const { t } = useTranslation();
  const { data: memories, isLoading, error, refetch } = useMemories();
  const [showAddModal, setShowAddModal] = useState(false);

  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setShowAddModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SwipeTabWrapper currentTab="memories">
        <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} maxFontSizeMultiplier={1.35}>
            {t('memories.title')}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
            {t('memories.subtitle')}
          </Text>
        </View>
        <Button
          title={`+ ${t('memories.addMemory')}`}
          variant="primary"
          size="sm"
          onPress={handleOpenAdd}
        />
      </View>

      {isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : error ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={error.message}
          onRetry={refetch}
          retryTitle={t('common.retry')}
        />
      ) : memories?.length === 0 ? (
        <EmptyState
          title={t('memories.title')}
          description={t('memories.emptyMemories')}
          actionTitle={t('memories.addMemory')}
          onAction={handleOpenAdd}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
        >
          {memories?.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </ScrollView>
      )}

        <AddMemoryModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    paddingBottom: scale(14),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: scale(12),
  },
  title: {
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(4),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
});
