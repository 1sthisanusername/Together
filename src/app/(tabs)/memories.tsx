import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemories, MemoryCard, AddMemoryModal } from '@/features/memories';
import { LoadingState, ErrorState, Button, EmptyState } from '@/shared/ui';

export default function MemoriesScreen() {
  const { t } = useTranslation();
  const { data: memories, isLoading, error, refetch } = useMemories();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('memories.title')}</Text>
          <Text style={styles.subtitle}>{t('memories.subtitle')}</Text>
        </View>
        <Button
          title={`+ ${t('memories.addMemory')}`}
          variant="primary"
          size="sm"
          onPress={() => setShowAddModal(true)}
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
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
