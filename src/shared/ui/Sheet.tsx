import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  // Approximate action bar height to provide matching padding in the scroll container
  const actionBarHeight = scale(44) + (bottomInset > 0 ? bottomInset : scale(12));

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

        {/* Scrollable Body - allows content to scroll when taller than viewport */}
        <KeyboardAwareScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: actionBarHeight },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={scale(24)}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScrollView>

        {/* Sticky close bar */}
        <KeyboardStickyView offset={{ closed: bottomInset, opened: 0 }}>
          <View
            style={[
              styles.stickyBar,
              { paddingBottom: bottomInset > 0 ? bottomInset : scale(12) },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardStickyView>
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
    flex: 1,
    backgroundColor: theme.colors.background, // #FFFDFB
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
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
    paddingHorizontal: scale(20),
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
  scrollFlex: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: scale(4),
    paddingBottom: scale(12),
  },
  stickyBar: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: scale(20),
    paddingTop: scale(12),
    paddingBottom: scale(12),
    ...theme.shadows.hardSm,
  },
  closeBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 9999,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignSelf: 'center',
    ...theme.shadows.hardSm,
  },
  closeBtnText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '700',
    color: theme.colors.text,
  },
});
