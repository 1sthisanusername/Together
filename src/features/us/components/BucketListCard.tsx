import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button } from '@/shared/ui';
import type { BucketItem } from '@/shared/types';
import { useAddBucketItem, useToggleBucketItem } from '../hooks/useUsData';

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
    padding: 20,
    marginVertical: 8,
    width: '100%',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  itemDone: {
    backgroundColor: '#F1F5F9',
  },
  checkbox: {
    fontSize: 18,
    color: '#6366F1',
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

