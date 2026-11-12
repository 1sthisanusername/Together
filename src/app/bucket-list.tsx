import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useBucketListItems,
  useAddBucketListItem,
  useUpdateBucketListItem,
  useToggleBucketListItem,
  useDeleteBucketListItem,
  BucketItemCard,
  AddEditBucketItemModal,
} from '@/features/bucketList';
import { useActiveCouple } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import type { BucketItem } from '@/shared/types';
import { ThemedConfirmDialog, ThemedToast, LoadingState, ErrorState } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'milestone', label: 'Milestone', icon: '🏆' },
  { id: 'cozy', label: 'Cozy', icon: '☕' },
  { id: 'adventure', label: 'Adventure', icon: '🏕️' },
];

export default function BucketListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';
  const myDisplayName = profile?.display_name || 'You';

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal & dialog state
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<BucketItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BucketItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries & Mutations
  const {
    items,
    allItems,
    pendingCount,
    completedCount,
    isLoading,
    error,
    refetch,
  } = useBucketListItems({
    status: statusFilter,
    category: categoryFilter,
  });

  const { mutate: addItem, isPending: isAdding } = useAddBucketListItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateBucketListItem();
  const { mutate: toggleItem } = useToggleBucketListItem();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteBucketListItem();

  const handleOpenAdd = () => {
    triggerHaptic('light');
    setItemToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: BucketItem) => {
    setItemToEdit(item);
    setModalVisible(true);
  };

  const handleSaveItem = (values: {
    id?: string;
    title: string;
    description?: string;
    category: string;
    targetDate?: string | null;
  }) => {
    if (values.id) {
      updateItem(
        {
          id: values.id,
          title: values.title,
          description: values.description,
          category: values.category,
          targetDate: values.targetDate,
        },
        {
          onSuccess: () => {
            setModalVisible(false);
            setToastMessage('Dream updated! ✨');
          },
          onError: (err: any) => {
            setToastMessage(err.message || 'Failed to update');
          },
        }
      );
    } else {
      addItem(
        {
          title: values.title,
          description: values.description,
          category: values.category,
          targetDate: values.targetDate,
        },
        {
          onSuccess: () => {
            setModalVisible(false);
            setToastMessage('Added to your Bucket List! 🎯');
          },
          onError: (err: any) => {
            setToastMessage(err.message || 'Failed to add');
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    deleteItem(itemToDelete.id, {
      onSuccess: () => {
        setItemToDelete(null);
        setToastMessage('Dream removed from list');
      },
      onError: (err: any) => {
        setToastMessage(err.message || 'Failed to delete');
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar with Back & Add Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButtonWrapper}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel="Back"
        >
          <View style={styles.btnSurface}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Bucket List 🎯</Text>

        <TouchableOpacity
          style={styles.addButtonWrapper}
          onPress={handleOpenAdd}
          activeOpacity={0.8}
          accessibilityLabel="Add dream"
        >
          <View style={[styles.btnSurface, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.addLabel, { color: theme.colors.textInverse }]}>+ Dream</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Segmented Status Tabs: Pending vs Completed vs All */}
      <View style={styles.segmentedContainer}>
        {(['pending', 'completed', 'all'] as const).map((tab) => {
          const isSelected = statusFilter === tab;
          let count = allItems.length;
          if (tab === 'pending') count = pendingCount;
          if (tab === 'completed') count = completedCount;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
              onPress={() => {
                triggerHaptic('selection');
                setStatusFilter(tab);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.segmentLabel, isSelected && styles.segmentLabelActive]}
              >
                {tab === 'pending'
                  ? `To Do (${count})`
                  : tab === 'completed'
                  ? `Done 🎉 (${count})`
                  : `All (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category Filter Chips Horizontal Bar */}
      <View style={styles.categoryBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBarContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setCategoryFilter(cat.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.filterChipLabel,
                    isSelected && styles.filterChipLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List or Empty / Loading State */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <LoadingState message="Loading your dreams..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Could not load dreams"
            message={(error as Error).message}
            onRetry={refetch}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + scale(24) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetch();
              }}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCardSurface}>
                <Text style={styles.emptyEmoji}>
                  {statusFilter === 'completed' ? '🌟' : '🗺️'}
                </Text>
                <Text style={styles.emptyTitle}>
                  {statusFilter === 'completed'
                    ? 'No dreams checked off yet!'
                    : 'Your Bucket List is waiting'}
                </Text>
                <Text style={styles.emptySub}>
                  {statusFilter === 'completed'
                    ? 'Check off dreams as you complete them together.'
                    : 'Tap "+ Dream" above to start planning your next adventure together.'}
                </Text>
              </View>
            </View>
          ) : (
            items.map((item) => (
              <BucketItemCard
                key={item.id}
                item={item}
                myId={user?.id}
                partnerName={partnerName}
                myDisplayName={myDisplayName}
                onToggle={(id, isCompleted) => toggleItem({ id, isCompleted })}
                onEdit={handleOpenEdit}
                onDelete={(itemToDelete) => setItemToDelete(itemToDelete)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Dream Modal */}
      <AddEditBucketItemModal
        visible={modalVisible}
        itemToEdit={itemToEdit}
        isSaving={isAdding || isUpdating}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveItem}
      />

      {/* Delete Confirmation Dialog */}
      <ThemedConfirmDialog
        visible={!!itemToDelete}
        title="Delete Dream?"
        message={`Are you sure you want to remove "${itemToDelete?.title}" from your bucket list?`}
        confirmLabel="Delete"
        cancelLabel="Keep"
        isDestructive={true}
        emoji="🗑️"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Themed Toast Notification */}
      <ThemedToast
        message={toastMessage || ''}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
        type="success"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
  },
  backButtonWrapper: {
    position: 'relative',
  },
  addButtonWrapper: {
    position: 'relative',
  },
  btnSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    gap: scale(4),
    ...theme.shadows.hardSm,
  },
  backArrow: {
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
  },
  backLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text,
  },
  screenTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
  },
  addLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '800',
    color: theme.colors.text,
  },
  segmentedContainer: {
    flexDirection: 'row',
    marginHorizontal: scale(16),
    marginTop: scale(6),
    marginBottom: scale(8),
    backgroundColor: theme.colors.surfaceBlush,
    padding: scale(4),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: scale(7),
    alignItems: 'center',
    borderRadius: theme.roundness.full,
  },
  segmentTabActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.hardSm,
  },
  segmentLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  segmentLabelActive: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  categoryBarWrapper: {
    marginBottom: scale(8),
  },
  categoryBarContent: {
    paddingHorizontal: scale(16),
    gap: scale(6),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: scale(4),
  },
  filterChipSelected: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.primary,
  },
  filterChipIcon: {
    fontSize: scale(11),
  },
  filterChipLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    paddingTop: scale(4),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  emptyContainer: {
    position: 'relative',
    marginHorizontal: scale(16),
    marginTop: scale(24),
  },
  emptyCardSurface: {
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(24),
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emptyEmoji: {
    fontSize: scale(36),
    marginBottom: scale(10),
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: scale(18),
  },
});
