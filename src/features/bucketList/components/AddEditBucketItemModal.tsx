import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Input, DatePickerField } from '@/shared/ui';
import type { BucketItem } from '@/shared/types';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface AddEditBucketItemModalProps {
  visible: boolean;
  itemToEdit: BucketItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: {
    id?: string;
    title: string;
    description?: string;
    category: string;
    targetDate?: string | null;
  }) => void;
}

const CATEGORIES = [
  { id: 'travel', label: 'Travel', icon: '✈️', color: theme.colors.pool },
  { id: 'food', label: 'Food', icon: '🍕', color: theme.colors.secondary },
  { id: 'milestone', label: 'Milestone', icon: '🏆', color: theme.colors.bubblegum },
  { id: 'cozy', label: 'Cozy', icon: '☕', color: theme.colors.primary },
  { id: 'adventure', label: 'Adventure', icon: '🏕️', color: theme.colors.secondary },
];

export const AddEditBucketItemModal: React.FC<AddEditBucketItemModalProps> = ({
  visible,
  itemToEdit,
  isSaving,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('travel');
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (itemToEdit) {
        setTitle(itemToEdit.title);
        setDescription(itemToEdit.description || '');
        setCategory(itemToEdit.category || 'travel');
        setTargetDate(itemToEdit.target_date || null);
      } else {
        setTitle('');
        setDescription('');
        setCategory('travel');
        setTargetDate(null);
      }
      setErrorMsg(null);
    }
  }, [visible, itemToEdit]);

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a title for your bucket list dream');
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    onSave({
      id: itemToEdit?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      targetDate: targetDate || null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* Hard Ink Shadow */}
          <View style={styles.modalShadow} />

          {/* Modal Surface */}
          <View style={styles.modalSurface}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {itemToEdit ? '✏️ Edit Dream' : '🎯 Add to Bucket List'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Dream Title *</Text>
              <Input
                placeholder="e.g. Watch the sunset in Santorini"
                value={title}
                onChangeText={(val) => {
                  setTitle(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                maxLength={120}
              />
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              {/* Description Input */}
              <Text style={styles.inputLabel}>Notes & Details (optional)</Text>
              <Input
                placeholder="Any specific plans, places to visit, or ideas..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{ height: scale(72), textAlignVertical: 'top' }}
              />

              {/* Category Chips */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          backgroundColor: cat.color,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic('light');
                        setCategory(cat.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryChipLabel,
                          isSelected && styles.categoryChipLabelSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Target Date (optional) */}
              <Text style={styles.inputLabel}>Target Date (optional)</Text>
              <DatePickerField
                placeholder="Pick an estimated date"
                value={targetDate || ''}
                onChange={(val) => setTargetDate(val || null)}
              />

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  size="md"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title={itemToEdit ? 'Save Changes' : 'Add Dream 💕'}
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  disabled={isSaving}
                  onPress={handleSave}
                  style={{ flex: 1.5 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(18),
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: scale(380),
    maxHeight: '90%',
  },
  modalShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(20),
    zIndex: 0,
  },
  modalSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    borderRadius: scale(20),
    padding: scale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  inputLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: scale(10),
    marginBottom: scale(4),
  },
  errorText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.danger,
    marginTop: scale(-4),
    marginBottom: scale(6),
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginBottom: scale(6),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
    gap: scale(4),
  },
  categoryChipIcon: {
    fontSize: scale(12),
  },
  categoryChipLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  categoryChipLabelSelected: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(18),
    marginBottom: scale(4),
  },
});
