import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/shared/ui';
import type { Memory } from '@/shared/types';
import { useDeleteMemory } from '../hooks/useMemories';
import { theme } from '@/shared/theme';

export interface MemoryCardProps {
  memory: Memory;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  const { mutate: deleteMemory, isPending: isDeleting } = useDeleteMemory();

  const handleDelete = () => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMemory({
              memoryId: memory.id,
              mediaId: memory.media_id,
            }),
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.dateBadge}>
          📅 {new Date(memory.memory_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <View style={styles.headerRight}>
          {memory.favorite && <Text style={styles.favoriteBadge}>⭐ Favorite</Text>}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{memory.title}</Text>
      {memory.note ? <Text style={styles.note}>{memory.note}</Text> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 6,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  favoriteBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  deleteText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  note: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
});
