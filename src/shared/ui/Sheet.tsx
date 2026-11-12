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
    backgroundColor: 'rgba(62, 39, 35, 0.5)', // Warm Cozy Night backdrop
  },
  sheetContainer: {
    backgroundColor: theme.colors.background, // #FFFDFB
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    paddingHorizontal: scale(20),
    paddingBottom: scale(36),
    paddingTop: scale(12),
    ...theme.shadows.card,
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
    minWidth: scale(48),
    minHeight: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePill: {
    width: scale(32),
    height: scale(32),
    borderRadius: 9999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
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
