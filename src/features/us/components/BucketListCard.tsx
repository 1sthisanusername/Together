import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button } from '@/shared/ui';
import type { BucketItem } from '@/shared/types';
import { useAddBucketItem, useToggleBucketItem } from '../hooks/useUsData';
import { theme } from '@/shared/theme';

export interface BucketListCardProps {
  items: BucketItem[];
}

export const BucketListCard: React.FC<BucketListCardProps> = ({ items }) => {
  const { t } = useTranslation();
  const [newItemTitle, setNewItemTitle] = useState('');
  const { mutate: addItem, isPending: isAdding } = useAddBucketItem();
  const { mutate: toggleItem } = useToggleBucketItem();

  const handleAdd = () => {
    if (!newItemTitle.trim() || isAdding) return;
    addItem({ title: newItemTitle.trim() });
    setNewItemTitle('');
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>🎯 {t('us.bucketListTitle')}</Text>

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

      <View style={styles.itemsList}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>{t('common.empty')}</Text>
        ) : (
          items.map((item) => {
            const isDone = !!item.completed_at;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, isDone && styles.itemDone]}
                onPress={() => toggleItem({ id: item.id, isCompleted: !isDone })}
                activeOpacity={0.7}
              >
                <Text style={styles.checkbox}>{isDone ? '☑' : '☐'}</Text>
                <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginVertical: 8,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    borderRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  itemDone: {
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  checkbox: {
    fontSize: 18,
    color: theme.colors.primary, // #b69788
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text, // #42362e
    flex: 1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
