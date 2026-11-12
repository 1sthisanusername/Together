import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, DatePickerField, FormSheet } from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import {
  useAddImportantDate,
  useUpdateImportantDate,
  useDeleteImportantDate,
} from '../hooks/useUsData';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { theme, scale } from '@/shared/theme';

export interface ImportantDatesListProps {
  dates: ImportantDate[];
}

export const ImportantDatesList: React.FC<ImportantDatesListProps> = ({ dates }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  const { mutate: addDate, isPending: isAdding } = useAddImportantDate();
  const { mutate: updateDate, isPending: isUpdating } = useUpdateImportantDate();
  const { mutate: deleteDate } = useDeleteImportantDate();

  const handleStartAdd = () => {
    setEditingId(null);
    setTitle('');
    setDateStr('');
    setIsRecurring(true);
    setShowAdd(!showAdd);
  };

  const handleStartEdit = (item: ImportantDate) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDateStr(item.event_date);
    setIsRecurring(item.is_recurring ?? true);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!title.trim() || !dateStr.trim()) return;

    if (editingId) {
      updateDate({
        id: editingId,
        title: title.trim(),
        eventDate: dateStr.trim(),
        isRecurring,
      });
    } else {
      addDate({
        title: title.trim(),
        eventDate: dateStr.trim(),
        category: 'anniversary',
        isRecurring,
      });
    }

    setTitle('');
    setDateStr('');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleDelete = (id: string, itemTitle: string) => {
    Alert.alert(
      'Delete Date',
      `Are you sure you want to remove "${itemTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDate(id),
        },
      ]
    );
  };

  const handleClose = () => {
    setTitle('');
    setDateStr('');
    setEditingId(null);
    setShowAdd(false);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 {t('us.importantDatesTitle')}</Text>
        <Button
          title={`+ ${t('us.addDate')}`}
          size="sm"
          variant="ghost"
          onPress={handleStartAdd}
        />
      </View>

      <FormSheet
        visible={showAdd}
        onClose={handleClose}
        title={editingId ? 'Edit Important Date' : 'Add Special Date'}
        primaryLabel={t('common.save')}
        onPrimary={handleSave}
        primaryDisabled={!title.trim() || !dateStr.trim() || isAdding || isUpdating}
        primaryLoading={isAdding || isUpdating}
        disabledReason={!title.trim() ? 'Please enter a title' : !dateStr.trim() ? 'Please choose a date' : null}
        secondary={
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={handleClose}
          />
        }
      >
        <View style={styles.formSheetContent}>
          <Input
            placeholder="e.g. First Date, First Kiss, First Trip..."
            value={title}
            onChangeText={setTitle}
          />

          <DatePickerField
            placeholder="Select date"
            value={dateStr}
            onChange={setDateStr}
          />

          <TouchableOpacity
            style={styles.recurringRow}
            onPress={() => setIsRecurring(!isRecurring)}
            activeOpacity={0.7}
          >
            <Text style={styles.checkbox}>{isRecurring ? '☑' : '☐'}</Text>
            <Text style={styles.recurringLabel}>Repeat every year (yearly reminder)</Text>
          </TouchableOpacity>
        </View>
      </FormSheet>

      <View style={styles.list}>
        {dates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No special dates added yet.</Text>
            <Text style={styles.emptySubtext}>
              Add moments like your first date, first trip, or memorable milestones!
            </Text>
          </View>
        ) : (
          dates.map((d) => {
            const addedByText =
              d.created_by === user?.id ? 'Added by you' : `Added by ${partnerName}`;

            return (
              <View key={d.id} style={styles.dateRow}>
                <View style={styles.dateIconWrapper}>
                  <Text style={styles.dateIcon}>💍</Text>
                </View>

                <View style={styles.dateContent}>
                  <Text style={styles.dateTitle}>{d.title}</Text>
                  <Text style={styles.dateSub}>
                    {new Date(d.event_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.tagRow}>
                    <Text style={styles.addedByTag}>{addedByText}</Text>
                    {d.is_recurring && <Text style={styles.recurringTag}>🔁 Yearly</Text>}
                  </View>
                </View>

                {/* Edit & Delete Action Buttons */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    onPress={() => handleStartEdit(d)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(d.id, d.title)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(22),
    marginVertical: scale(8),
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.roundness.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(16),
  },
  title: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  addForm: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: scale(14),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  formTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(10),
  },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginVertical: scale(10),
  },
  checkbox: {
    fontSize: scale(18),
    color: theme.colors.primary,
  },
  recurringLabel: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: scale(6),
  },
  list: {
    gap: scale(10),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  dateIconWrapper: {
    marginRight: scale(12),
  },
  dateIcon: {
    fontSize: scale(22),
  },
  dateContent: {
    flex: 1,
  },
  dateTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(2),
  },
  dateSub: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: scale(4),
    alignItems: 'center',
  },
  addedByTag: {
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceDisabled,
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: theme.roundness.full,
  },
  recurringTag: {
    fontSize: scale(11),
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginLeft: scale(8),
  },
  actionBtn: {
    padding: scale(4),
  },
  editIcon: {
    fontSize: scale(15),
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  deleteIcon: {
    fontSize: scale(15),
    color: theme.colors.danger,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scale(16),
  },
  emptyText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: scale(4),
  },
  emptySubtext: {
    fontSize: scale(12),
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: scale(16),
  },
  formSheetContent: {
    paddingBottom: scale(12),
  },
});
