import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemories, MemoryCard, AddMemoryModal } from '@/features/memories';
import { useLetters, LetterCard, WriteLetterModal, ReadLetterModal } from '@/features/letters';
import { useActiveCouple } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { SkeletonList, ErrorState, Button, EmptyState, SwipeTabWrapper, ResponsiveContainer, LockIcon } from '@/shared/ui';
import type { Letter } from '@/shared/types';
import { theme, scale, useResponsiveLayout, triggerHaptic } from '@/shared/theme';

export default function MemoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const [activeSection, setActiveSection] = useState<'memories' | 'letters'>('memories');

  // Memories data
  const {
    data: memories,
    isLoading: isMemoriesLoading,
    error: memoriesError,
    refetch: refetchMemories,
  } = useMemories();
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);

  // Letters data
  const {
    data: letters,
    isLoading: isLettersLoading,
    error: lettersError,
    refetch: refetchLetters,
  } = useLetters();
  const [showWriteLetterModal, setShowWriteLetterModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const { horizontalGutter, columns, s } = useResponsiveLayout();

  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const handleOpenAdd = () => {
    triggerHaptic('light');
    if (activeSection === 'memories') {
      setShowAddMemoryModal(true);
    } else {
      setShowWriteLetterModal(true);
    }
  };

  const handleRefresh = () => {
    if (activeSection === 'memories') {
      refetchMemories();
    } else {
      refetchLetters();
    }
  };

  const isLoading = activeSection === 'memories' ? isMemoriesLoading : isLettersLoading;
  const error = activeSection === 'memories' ? memoriesError : lettersError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SwipeTabWrapper currentTab="memories">
        <View style={styles.header}>
          <ResponsiveContainer
            wide
            style={[styles.headerInner, { paddingHorizontal: horizontalGutter }]}
          >
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { fontSize: s(26) }]} maxFontSizeMultiplier={1.35}>
                  {activeSection === 'memories' ? t('memories.title') : t('letters.title')}
                </Text>
                <View style={styles.titleDot} />
              </View>
              <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
                {activeSection === 'memories'
                  ? t('memories.subtitle')
                  : t('memories.lettersSubtitle')}
              </Text>
            </View>
            <Button
              title={activeSection === 'memories' ? `+ ${t('memories.addMemory')}` : `+ ${t('letters.writeNew')}`}
              variant="primary"
              size="sm"
              onPress={handleOpenAdd}
            />
          </ResponsiveContainer>

          {/* Segmented Control */}
          <ResponsiveContainer wide style={{ paddingHorizontal: horizontalGutter, marginTop: scale(12) }}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  activeSection === 'memories' && styles.segmentBtnActive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveSection('memories');
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeSection === 'memories' }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeSection === 'memories' && styles.segmentTextActive,
                  ]}
                >
                  📸 {t('memories.title')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  activeSection === 'letters' && styles.segmentBtnActive,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveSection('letters');
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeSection === 'letters' }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    activeSection === 'letters' && styles.segmentTextActive,
                  ]}
                >
                  💌 {t('letters.title')}
                </Text>
              </TouchableOpacity>
            </View>
          </ResponsiveContainer>
        </View>

        {isLoading ? (
          <ResponsiveContainer wide>
            <SkeletonList count={4} lines={2} />
          </ResponsiveContainer>
        ) : error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={handleRefresh}
            retryTitle={t('common.retry')}
          />
        ) : activeSection === 'memories' ? (
          memories?.length === 0 ? (
            <EmptyState
              title={t('memories.title')}
              description={t('memories.emptyMemories')}
              actionTitle={t('memories.addMemory')}
              onAction={handleOpenAdd}
            />
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
            >
              <ResponsiveContainer
                wide
                style={columns === 2 ? styles.gridTwoCols : styles.singleCol}
              >
                {memories?.map((memory) => (
                  <View
                    key={memory.id}
                    style={columns === 2 ? styles.gridItemHalf : styles.gridItemFull}
                  >
                    <MemoryCard memory={memory} />
                  </View>
                ))}
              </ResponsiveContainer>
            </ScrollView>
          )
        ) : (
          /* Letters Section */
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
          >
            <ResponsiveContainer wide>
              {/* Private Couple Vault Access Card */}
              <TouchableOpacity
                style={styles.vaultCard}
                onPress={() => {
                  triggerHaptic('medium');
                  router.push('/vault');
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open Private Couple Vault"
              >
                <View style={styles.vaultCardLeft}>
                  <View style={styles.vaultIconBadge}>
                    <LockIcon color={theme.colors.text} size={20} focused />
                  </View>
                  <View style={styles.vaultCardTextCol}>
                    <Text style={styles.vaultCardTitle}>Private Couple Vault</Text>
                    <Text style={styles.vaultCardSub}>PIN-protected secret letters & notes</Text>
                  </View>
                </View>
                <View style={styles.vaultCardPill}>
                  <Text style={styles.vaultCardPillText}>Open →</Text>
                </View>
              </TouchableOpacity>

              {letters?.length === 0 ? (
                <EmptyState
                  title={t('letters.title')}
                  description="No letters written yet. Leave a sweet love note, scheduled memory or voice letter for your partner!"
                  actionTitle={`+ ${t('letters.writeNew')}`}
                  onAction={handleOpenAdd}
                />
              ) : (
                letters?.map((letter) => (
                  <LetterCard
                    key={letter.id}
                    letter={letter}
                    isFromMe={letter.sender_id === user?.id}
                    partnerName={partnerName}
                    onPress={() => {
                      triggerHaptic('light');
                      setSelectedLetter(letter);
                    }}
                  />
                ))
              )}
            </ResponsiveContainer>
          </ScrollView>
        )}

        <AddMemoryModal
          visible={showAddMemoryModal}
          onClose={() => setShowAddMemoryModal(false)}
        />

        <WriteLetterModal
          visible={showWriteLetterModal}
          onClose={() => setShowWriteLetterModal(false)}
          partnerName={partnerName}
        />

        <ReadLetterModal
          letter={selectedLetter}
          visible={!!selectedLetter}
          onClose={() => setSelectedLetter(null)}
          partnerName={partnerName}
        />
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: scale(14),
    paddingBottom: scale(12),
    backgroundColor: theme.colors.surfaceSubtle, // #FFF0ED
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // #FBE9E7
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    marginRight: scale(12),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: scale(4),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  titleDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: theme.colors.primary,
    marginTop: scale(4),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.full,
    padding: scale(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.hardSm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: scale(8),
    borderRadius: theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingVertical: scale(16),
  },
  singleCol: {
    gap: scale(4),
  },
  gridTwoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  gridItemFull: {
    width: '100%',
  },
  gridItemHalf: {
    width: '48.5%',
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.rose,
    borderRadius: 20,
    padding: scale(14),
    marginBottom: scale(16),
    ...theme.shadows.hardSm,
  },
  vaultCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  vaultIconBadge: {
    width: scale(40),
    height: scale(40),
    borderRadius: 14,
    backgroundColor: theme.colors.sunset,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultCardTextCol: {
    flex: 1,
  },
  vaultCardTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(15),
    fontWeight: '800',
    color: theme.colors.text,
  },
  vaultCardSub: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  vaultCardPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: 9999,
  },
  vaultCardPillText: {
    fontFamily: theme.typography.fontFamilies.display,
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: '800',
  },
});
