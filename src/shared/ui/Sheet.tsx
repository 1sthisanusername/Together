import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHandle} />
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title} maxFontSizeMultiplier={1.35}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeTouchArea}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close sheet"
            >
              <View style={styles.closePill}>
                <Text style={styles.closeButton}>✕</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.content}>{children}</View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.65)', // Warm Ink backdrop
  },
  sheetContainer: {
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(20),
    paddingBottom: scale(36),
    paddingTop: scale(12),
  },
  sheetHandle: {
    width: scale(44),
    height: scale(6),
    backgroundColor: theme.colors.border,
    borderRadius: scale(3),
    alignSelf: 'center',
    marginBottom: scale(14),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  closeTouchArea: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
  },
  content: {
    width: '100%',
  },
});
