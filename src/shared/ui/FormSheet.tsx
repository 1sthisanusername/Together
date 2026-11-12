import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { theme, scale } from '@/shared/theme';
import { Button } from './Button';

export interface FormSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondary?: React.ReactNode;
  disabledReason?: string | null;
  children: React.ReactNode;
}

/**
 * FormSheet: Standardized accessible modal form container.
 * Features:
 * - Header with title and accessible close button
 * - Scrollable body (KeyboardAwareScrollView with keyboardShouldPersistTaps="handled")
 * - Sticky action bar pinned directly above the keyboard via KeyboardStickyView
 *   (and above the device home indicator when closed)
 * - Identical behavior on Android and iOS
 * - Optional disabledReason displayed as plain text above the action bar
 */
export const FormSheet: React.FC<FormSheetProps> = ({
  visible,
  onClose,
  title,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondary,
  disabledReason,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

  // Approximate action bar height to provide matching padding in the scroll container
  const actionBarHeight = scale(68) + (bottomInset > 0 ? bottomInset : scale(12));

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
        {/* Top Drag Handle */}
        <View style={styles.sheetHandle} />

        {/* Header Bar */}
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

        {/* Scrollable Form Body */}
        <KeyboardAwareScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: primaryLabel || secondary ? actionBarHeight : scale(32) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={scale(24)}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScrollView>

        {/* Pinned Sticky Action Bar */}
        {(primaryLabel || secondary) && (
          <KeyboardStickyView offset={{ closed: bottomInset, opened: 0 }}>
            <View
              style={[
                styles.stickyBar,
                { paddingBottom: bottomInset > 0 ? bottomInset : scale(12) },
              ]}
            >
              {/* Optional Disabled Reason / Helper text */}
              {primaryDisabled && disabledReason ? (
                <Text style={styles.disabledReasonText} maxFontSizeMultiplier={1.3}>
                  {disabledReason}
                </Text>
              ) : null}

              <View style={styles.actionRow}>
                {secondary ? <View style={styles.secondaryContainer}>{secondary}</View> : null}
                {primaryLabel && onPrimary ? (
                  <Button
                    title={primaryLabel}
                    variant="primary"
                    size="lg"
                    disabled={primaryDisabled}
                    loading={primaryLoading}
                    onPress={onPrimary}
                    style={styles.primaryBtn}
                  />
                ) : null}
              </View>
            </View>
          </KeyboardStickyView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.5)', // Cozy Night warm backdrop
  },
  sheetContainer: {
    maxHeight: '92%',
    backgroundColor: theme.colors.background, // #FFFDFB
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
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
    paddingHorizontal: scale(20),
    marginBottom: scale(12),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: scale(8),
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
    paddingHorizontal: scale(20),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: scale(4),
  },
  stickyBar: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: scale(20),
    paddingTop: scale(12),
    ...theme.shadows.hardSm,
  },
  disabledReasonText: {
    fontSize: scale(12),
    fontFamily: theme.typography.fontFamilies.sans,
    color: theme.colors.textSecondary,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  secondaryContainer: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1,
  },
});

