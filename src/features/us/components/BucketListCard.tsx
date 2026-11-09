import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '@/shared/ui';
import type { BucketItem } from '@/shared/types';
import { useAddBucketItem, useToggleBucketItem } from '../hooks/useUsData';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface BucketListCardProps {
  items: BucketItem[];
}

export const BucketListCard: React.FC<BucketListCardProps> = ({ items }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [newItemTitle, setNewItemTitle] = useState('');
  const { mutate: addItem, isPending: isAdding } = useAddBucketItem();
  const { mutate: toggleItem } = useToggleBucketItem();

  const handleAdd = () => {
    if (!newItemTitle.trim() || isAdding) return;
    addItem({ title: newItemTitle.trim() });
    setNewItemTitle('');
  };

  const handleOpenFullList = () => {
    triggerHaptic('light');
    router.push('/bucket-list');
  };

  // Show top pending items first in preview
  const previewItems = [...items]
    .sort((a, b) => {
      if (!!a.completed_at === !!b.completed_at) return 0;
      return a.completed_at ? 1 : -1;
    })
    .slice(0, 4);

  const pendingCount = items.filter((i) => !i.completed_at).length;

  return (
    <View style={styles.cardContainer}>
      {/* Hard Ink Shadow */}
      <View style={styles.cardShadow} />

      {/* Surface */}
      <View style={styles.cardSurface}>
        {/* Header Row: Title & View All Button */}
        <View style={styles.headerRow}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.cardTitle}>🎯 {t('us.bucketListTitle')}</Text>
            {pendingCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={handleOpenFullList}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add Row */}
        <View style={styles.addInputRow}>
          <Input
            placeholder={t('us.bucketItemPlaceholder')}
            value={newItemTitle}
            onChangeText={setNewItemTitle}
            containerStyle={styles.inputContainer}
          />
          <Button
            title={t('us.addBucketItem')}
            size="sm"
            variant="primary"
            onPress={handleAdd}
            disabled={!newItemTitle.trim() || isAdding}
            loading={isAdding}
          />
        </View>

        {/* Items List Preview */}
        <View style={styles.itemsList}>
          {previewItems.length === 0 ? (
            <Text style={styles.emptyText}>{t('common.empty')}</Text>
          ) : (
            previewItems.map((item) => {
              const isDone = !!item.completed_at;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemRow, isDone && styles.itemDone]}
                  onPress={() => toggleItem({ id: item.id, isCompleted: !isDone })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.checkbox}>{isDone ? '☑' : '☐'}</Text>
                  <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Footer Link if more items exist */}
        {items.length > 4 && (
          <TouchableOpacity
            style={styles.moreFooter}
            onPress={handleOpenFullList}
            activeOpacity={0.7}
          >
            <Text style={styles.moreFooterText}>
              + {items.length - 4} more dreams in your list • View full list
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    marginVertical: scale(8),
    width: '100%',
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(18),
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scale(18),
    padding: scale(18),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
  },
  countBadge: {
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: scale(10),
    paddingHorizontal: scale(7),
    paddingVertical: scale(1),
  },
  countBadgeText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '800',
    color: theme.colors.text,
  },
  viewAllBtn: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(8),
    backgroundColor: '#F8F4EE',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  viewAllText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: scale(8),
    alignItems: 'flex-start',
    marginBottom: scale(14),
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  itemsList: {
    gap: scale(6),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
    backgroundColor: '#FAF7F2',
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: '#E8DED1',
  },
  itemDone: {
    backgroundColor: '#F0ECE4',
    opacity: 0.7,
  },
  checkbox: {
    fontSize: scale(15),
    color: theme.colors.primary,
    marginRight: scale(8),
    fontWeight: '900',
  },
  itemTitle: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: scale(8),
  },
  moreFooter: {
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#EBE2D5',
    alignItems: 'center',
  },
  moreFooterText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
