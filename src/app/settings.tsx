import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsView } from '@/features/settings';
import { useAuthStore } from '@/features/auth';
import { UnlinkCoupleDialog } from '@/features/couple';
import { ThemedConfirmDialog } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const signOut = useAuthStore((state) => state.signOut);

  const [menuVisible, setMenuVisible] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const handleOpenMenu = () => {
    triggerHaptic('light');
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  const handlePromptSignOut = () => {
    setMenuVisible(false);
    triggerHaptic('light');
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    triggerHaptic('medium');
    await signOut();
  };

  const handlePromptUnlink = () => {
    setMenuVisible(false);
    triggerHaptic('warning');
    setShowUnlinkModal(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backText} maxFontSizeMultiplier={1.35}>
            ← {t('common.back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title} maxFontSizeMultiplier={1.35}>
          {t('settings.title')}
        </Text>
        
        {/* Header Overflow ⋮ Menu Button */}
        <TouchableOpacity
          onPress={handleOpenMenu}
          style={styles.menuBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="More settings options"
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Main Settings content without Sign Out & Unlink in the main list */}
      <SettingsView />

      {/* Header Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableWithoutFeedback onPress={handleCloseMenu}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handlePromptSignOut}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>🚪</Text>
                  <Text style={styles.menuItemText}>{t('settings.signOut')}</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handlePromptUnlink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>💔</Text>
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                    Unlink Couple Space…
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Sign Out Themed Confirm Dialog */}
      <ThemedConfirmDialog
        visible={showSignOutConfirm}
        title="Sign Out of Together?"
        message="You can sign back in anytime with your Google account to restore your space."
        emoji="👋"
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        isDestructive={false}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* 3-Step Protected Unlink Safeguard Dialog */}
      <UnlinkCoupleDialog
        visible={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(8),
    minHeight: 36,
    justifyContent: 'center',
  },
  backText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  title: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  menuBtn: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDots: {
    fontSize: scale(22),
    fontWeight: '900',
    color: theme.colors.text,
    lineHeight: scale(22),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  menuDropdown: {
    position: 'absolute',
    top: scale(62),
    right: scale(16),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: scale(6),
    minWidth: scale(190),
    ...theme.shadows.hardSm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    gap: scale(10),
  },
  menuItemIcon: {
    fontSize: scale(16),
  },
  menuItemText: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  menuItemDanger: {
    color: theme.colors.danger,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: scale(4),
  },
});
