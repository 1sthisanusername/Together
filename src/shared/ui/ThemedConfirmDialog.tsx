import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface ThemedConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  emoji?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ThemedConfirmDialog: React.FC<ThemedConfirmDialogProps> = ({
  visible,
  title,
  message,
  emoji = '💌',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onCancel}
    >
      <TouchableWithoutFeedback onPress={isLoading ? undefined : onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialogCardWrapper}>
              {/* Hard Ink Shadow */}
              <View style={styles.dialogShadow} />

              {/* Paper Surface */}
              <View style={styles.dialogSurface}>
                {/* Cute Sticker Icon */}
                <View style={styles.emojiBadge}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </View>

                {/* Dialog Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Dialog Body Text */}
                <Text style={styles.message}>{message}</Text>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={[styles.btn, styles.cancelBtn]}
                    onPress={onCancel}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
                  </TouchableOpacity>

                  {/* Confirm / Destructive Button */}
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      isDestructive ? styles.destructiveBtn : styles.confirmBtn,
                      isLoading && styles.btnDisabled,
                    ]}
                    onPress={onConfirm}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={isDestructive ? '#FFFFFF' : theme.colors.text}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.confirmBtnText,
                          isDestructive && styles.destructiveBtnText,
                        ]}
                      >
                        {confirmLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  dialogCardWrapper: {
    width: '100%',
    maxWidth: scale(340),
    position: 'relative',
  },
  dialogShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    bottom: -5,
    backgroundColor: theme.colors.border,
    borderRadius: 20,
  },
  dialogSurface: {
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: theme.colors.border, // Ink #2B2118
    padding: scale(22),
    alignItems: 'center',
  },
  emojiBadge: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(12),
    ...theme.shadows.hardSm,
  },
  emojiText: {
    fontSize: 26,
  },
  title: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(19),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(8),
  },
  message: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    lineHeight: scale(20),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  actionRow: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
  },
  btn: {
    flex: 1,
    height: scale(46),
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cancelBtn: {
    backgroundColor: theme.colors.surface,
  },
  cancelBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  confirmBtn: {
    backgroundColor: theme.colors.stickers.sunshine, // Warm Buttercup
  },
  destructiveBtn: {
    backgroundColor: theme.colors.danger, // Tomato / Red
    borderColor: theme.colors.border,
  },
  confirmBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  destructiveBtnText: {
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});

