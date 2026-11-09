import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BucketItem } from '@/shared/types';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface BucketItemCardProps {
  item: BucketItem;
  myId?: string;
  partnerName?: string;
  myDisplayName?: string;
  onToggle: (id: string, isCompleted: boolean) => void;
  onEdit: (item: BucketItem) => void;
  onDelete: (item: BucketItem) => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  travel: { label: 'Travel', icon: '✈️', color: theme.colors.pool },
  food: { label: 'Food', icon: '🍕', color: theme.colors.secondary },
  milestone: { label: 'Milestone', icon: '🏆', color: theme.colors.bubblegum },
  cozy: { label: 'Cozy', icon: '☕', color: theme.colors.primary },
  adventure: { label: 'Adventure', icon: '🏕️', color: theme.colors.secondary },
};

export const BucketItemCard: React.FC<BucketItemCardProps> = ({
  item,
  myId,
  partnerName = 'Partner',
  myDisplayName = 'You',
  onToggle,
  onEdit,
  onDelete,
}) => {
  const isDone = !!item.completed_at;
  const meta = CATEGORY_META[item.category || 'adventure'] || CATEGORY_META.adventure;

  // Determine attribution labels
  const isCreatorMe = item.created_by === myId;
  const creatorLabel = isCreatorMe ? 'You' : partnerName;

  let completerLabel: string | null = null;
  if (isDone) {
    completerLabel = item.completed_by === myId ? 'You' : partnerName;
  }

  const handleToggle = () => {
    triggerHaptic(isDone ? 'light' : 'success');
    onToggle(item.id, !isDone);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Hard Ink Shadow */}
      <View style={styles.cardShadow} />

      {/* Card Surface */}
      <View style={[styles.cardSurface, isDone && styles.cardSurfaceDone]}>
        {/* Top meta row: Category pill + Action icons */}
        <View style={styles.topRow}>
          <View style={[styles.categoryBadge, { backgroundColor: meta.color }]}>
            <Text style={styles.categoryIcon}>{meta.icon}</Text>
            <Text style={styles.categoryLabel}>{meta.label}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                onEdit(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Edit ${item.title}`}
              style={styles.actionIconButton}
            >
              <Text style={styles.actionIconText}>✏️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('warning');
                onDelete(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`Delete ${item.title}`}
              style={styles.actionIconButton}
            >
              <Text style={styles.actionIconText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Middle interactive row: Checkbox + Title */}
        <TouchableOpacity
          style={styles.interactiveRow}
          onPress={handleToggle}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel={`${item.title}, ${isDone ? 'completed' : 'pending'}`}
        >
          {/* Custom Chunky Checkbox */}
          <View style={[styles.checkboxSurface, isDone && styles.checkboxDone]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>
              {item.title}
            </Text>

            {item.description ? (
              <Text style={[styles.description, isDone && styles.descriptionDone]} numberOfLines={3}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Footer meta row: Target date & Attribution */}
        <View style={styles.footerRow}>
          <View style={styles.attributionContainer}>
            <Text style={styles.attributionText}>
              Added by <Text style={styles.authorBold}>{creatorLabel}</Text>
              {isDone && completerLabel ? (
                <>
                  {' • '}
                  <Text style={styles.completedTag}>Done by {completerLabel} 🎉</Text>
                </>
              ) : null}
            </Text>
          </View>

          {item.target_date ? (
            <View style={styles.dateTag}>
              <Text style={styles.dateTagText}>📅 {item.target_date}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    marginVertical: scale(6),
    marginHorizontal: scale(16),
  },
  cardShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(16),
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: scale(16),
    padding: scale(14),
  },
  cardSurfaceDone: {
    backgroundColor: '#F8F4EE',
    borderColor: '#7A6B5D',
    opacity: 0.88,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(8),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    gap: scale(4),
  },
  categoryIcon: {
    fontSize: scale(11),
  },
  categoryLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(6),
    alignItems: 'center',
  },
  actionIconButton: {
    padding: scale(4),
  },
  actionIconText: {
    fontSize: scale(13),
  },
  interactiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
  },
  checkboxSurface: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(7),
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(2),
  },
  checkboxDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.border,
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: scale(14),
    lineHeight: scale(16),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: scale(20),
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  description: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginTop: scale(4),
    lineHeight: scale(16),
  },
  descriptionDone: {
    color: theme.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(10),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#EBE2D5',
  },
  attributionContainer: {
    flex: 1,
  },
  attributionText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    color: theme.colors.textMuted,
  },
  authorBold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  completedTag: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dateTag: {
    backgroundColor: '#FFF8EB',
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: '#E2D4C3',
  },
  dateTagText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(10),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});
