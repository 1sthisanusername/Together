import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useDailyQuestion, useDailyQuestionHistory } from '../hooks/useDailyQuestion';
import { SparklesIcon, LetterIcon, HeartBeat } from '@/shared/ui';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export interface DailyQuestionCardProps {
  partnerName: string;
}

export const DailyQuestionCard: React.FC<DailyQuestionCardProps> = ({
  partnerName,
}) => {
  const {
    data: qData,
    isLoading,
    submitAnswer,
    isSubmitting,
  } = useDailyQuestion();

  const { data: history = [], isLoading: isLoadingHistory } = useDailyQuestionHistory();

  const [inputAnswer, setInputAnswer] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const submitScale = useSharedValue(1);
  const submitAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  if (isLoading || !qData) {
    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.cardSurface, styles.centerPadding]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading daily prompt…</Text>
        </View>
      </View>
    );
  }

  const { question, myAnswer, partnerAnswer, hasMyAnswer, hasBothAnswered, streak } =
    qData;

  const handleSubmit = async () => {
    if (!inputAnswer.trim() || isSubmitting) return;
    setErrorText(null);
    triggerHaptic('medium');
    try {
      await submitAnswer(inputAnswer);
      setInputAnswer('');
    } catch (err: any) {
      setErrorText(err.message || 'Failed to submit answer');
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardSurface}>
        {/* Header Row: Category pill, Streak & History */}
        <View style={styles.headerRow}>
          <View style={styles.headerBadges}>
            <View style={styles.categoryBadge}>
              <SparklesIcon color={theme.colors.textInverse} size={scale(13)} />
              <Text style={styles.categoryText}>Daily Question</Text>
            </View>

            {streak > 0 && (
              <View style={styles.streakBadge}>
                <HeartBeat active color={theme.colors.primary} size={6} />
                <Text style={styles.streakText}>{streak}d streak</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => {
              triggerHaptic('light');
              setShowHistoryModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Question Title */}
        <Text style={styles.questionText}>{question.text}</Text>

        {/* STATE 1: UNLOCKED - BOTH ANSWERED */}
        {hasBothAnswered ? (
          <View style={styles.unlockedContainer}>
            {/* Celebration Sticker */}
            <View style={styles.celebrationBadge}>
              <Text style={styles.celebrationText}>
                ✨ UNLOCKED! You both answered!
              </Text>
            </View>

            {/* My Answer */}
            <View style={styles.answerCard}>
              <Text style={styles.answerAuthor}>You</Text>
              <Text style={styles.answerContent}>{myAnswer}</Text>
            </View>

            {/* Partner's Answer */}
            <View style={[styles.answerCard, styles.partnerAnswerCard]}>
              <Text style={styles.answerAuthor}>{partnerName}</Text>
              <Text style={styles.answerContent}>{partnerAnswer}</Text>
            </View>
          </View>
        ) : hasMyAnswer ? (
          /* STATE 2: ANSWERED BY USER - WAITING FOR PARTNER */
          <View style={styles.waitingContainer}>
            {/* My Answer Box */}
            <View style={styles.myAnswerPreview}>
              <Text style={styles.answerAuthor}>Your Answer</Text>
              <Text style={styles.answerContent}>{myAnswer}</Text>
            </View>

            {/* Mystery Locked Card */}
            <View style={styles.lockedBox}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>
                Waiting for {partnerName}…
              </Text>
              <Text style={styles.lockedSubtitle}>
                {partnerName}&apos;s answer will be unlocked once they submit.
                Neither can peek early!
              </Text>
            </View>
          </View>
        ) : (
          /* STATE 3: UNANSWERED - INPUT FORM */
          <View style={styles.inputForm}>
            <TextInput
              style={styles.textInput}
              placeholder="Write your honest answer here…"
              placeholderTextColor={theme.colors.textSecondary}
              value={inputAnswer}
              onChangeText={setInputAnswer}
              multiline
              maxLength={400}
              editable={!isSubmitting}
            />

            {errorText ? (
              <Text style={styles.errorText}>{errorText}</Text>
            ) : null}

            <Pressable
              style={{ width: '100%' }}
              onPress={handleSubmit}
              disabled={!inputAnswer.trim() || isSubmitting}
              onPressIn={() => {
                if (inputAnswer.trim() && !isSubmitting) {
                  submitScale.value = withSpring(0.96, motion.spring);
                  triggerHaptic('light');
                }
              }}
              onPressOut={() => {
                submitScale.value = withSpring(1, motion.spring);
              }}
              accessibilityRole="button"
              accessibilityLabel="Submit daily answer"
            >
              <Animated.View
                style={[
                  styles.submitBtn,
                  (!inputAnswer.trim() || isSubmitting) && styles.submitBtnDisabled,
                  submitAnimStyle,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.submitBtnInner}>
                    <LetterIcon
                      color={!inputAnswer.trim() ? theme.colors.textSecondary : '#FFFFFF'}
                      size={scale(16)}
                    />
                    <Text
                      style={[
                        styles.submitBtnText,
                        !inputAnswer.trim() && styles.submitBtnTextDisabled,
                      ]}
                    >
                      Submit Answer
                    </Text>
                  </View>
                )}
              </Animated.View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Past Answers History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Past Prompts 📖</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setShowHistoryModal(false);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close history"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {isLoadingHistory ? (
              <View style={styles.historyLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.historyLoadingText}>Loading past memories…</Text>
              </View>
            ) : history.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Text style={styles.historyEmptyEmoji}>💌</Text>
                <Text style={styles.historyEmptyTitle}>No Past Answers Yet</Text>
                <Text style={styles.historyEmptySubtitle}>
                  Answer daily questions with your partner to build your story archive here!
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.historyScroll}
                contentContainerStyle={styles.historyScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {history.map((item, idx) => (
                  <View key={`${item.questionDate}_${idx}`} style={styles.historyCard}>
                    <View style={styles.historyDateBadge}>
                      <Text style={styles.historyDateText}>📅 {item.questionDate}</Text>
                    </View>
                    <Text style={styles.historyQuestionText}>{item.questionText}</Text>

                    {item.hasBothAnswered ? (
                      <View style={styles.historyAnswersContainer}>
                        <View style={styles.historyAnswerRow}>
                          <Text style={styles.historyAuthorLabel}>You:</Text>
                          <Text style={styles.historyAnswerBody}>{item.myAnswer}</Text>
                        </View>
                        <View style={styles.historyAnswerRow}>
                          <Text style={styles.historyAuthorLabel}>{partnerName}:</Text>
                          <Text style={styles.historyAnswerBody}>{item.partnerAnswer}</Text>
                        </View>
                      </View>
                    ) : item.myAnswer ? (
                      <View style={styles.historyAnswersContainer}>
                        <View style={styles.historyAnswerRow}>
                          <Text style={styles.historyAuthorLabel}>You:</Text>
                          <Text style={styles.historyAnswerBody}>{item.myAnswer}</Text>
                        </View>
                        <Text style={styles.historyWaitingNote}>
                          🔒 Waiting for {partnerName}&apos;s answer
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.historyLockedNote}>
                        🔒 Hidden until answered
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: scale(7),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    padding: scale(20),
    ...theme.shadows.card,
  },
  centerPadding: {
    paddingVertical: scale(24),
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    ...theme.shadows.tiny,
  },
  historyBtnText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.kintsugi,
    borderRadius: theme.roundness.lg,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    ...theme.shadows.tiny,
  },
  categoryText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.textInverse,
  },
  streakBadge: {
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(9),
    paddingVertical: scale(4),
    ...theme.shadows.tiny,
  },
  streakText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.primary,
  },
  questionText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(17),
    lineHeight: scale(24),
    color: theme.colors.text,
    marginBottom: scale(16),
  },
  inputForm: {
    gap: scale(12),
  },
  textInput: {
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(15),
    color: theme.colors.text,
    minHeight: scale(96),
    textAlignVertical: 'top',
    ...theme.shadows.tiny2,
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(12),
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.lg,
    height: scale(52),
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hardSm,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
    ...theme.shadows.none,
  },
  submitBtnText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(15),
    color: '#FFFFFF',
  },
  submitBtnTextDisabled: {
    color: theme.colors.textSecondary,
  },
  waitingContainer: {
    gap: scale(12),
  },
  myAnswerPreview: {
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    ...theme.shadows.soft,
  },
  lockedBox: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.rose,
    borderStyle: 'dashed',
    borderRadius: theme.roundness.lg,
    padding: scale(18),
    alignItems: 'center',
    gap: scale(6),
    ...theme.shadows.soft,
  },
  lockIcon: {
    fontSize: scale(24),
    marginBottom: scale(4),
  },
  lockedTitle: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(15),
    color: theme.colors.text,
  },
  lockedSubtitle: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(18),
  },
  unlockedContainer: {
    gap: scale(12),
  },
  celebrationBadge: {
    backgroundColor: theme.colors.kintsugi,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    ...theme.shadows.tiny,
  },
  celebrationText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(13),
    color: theme.colors.textInverse,
  },
  answerCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    ...theme.shadows.soft,
  },
  partnerAnswerCard: {
    backgroundColor: theme.colors.surfaceBlush,
    ...theme.shadows.soft,
  },
  answerAuthor: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginBottom: scale(6),
  },
  answerContent: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(15),
    lineHeight: scale(22),
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness.xl,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    padding: scale(24),
    ...theme.shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(18),
    color: theme.colors.text,
  },
  modalCloseBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.tiny2,
  },
  modalCloseText: {
    fontSize: scale(18),
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyLoading: {
    paddingVertical: scale(32),
    alignItems: 'center',
    gap: scale(8),
  },
  historyLoadingText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
  },
  historyEmpty: {
    paddingVertical: scale(40),
    alignItems: 'center',
    gap: scale(10),
  },
  historyEmptyEmoji: {
    fontSize: scale(40),
  },
  historyEmptyTitle: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(16),
    color: theme.colors.text,
  },
  historyEmptySubtitle: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(18),
  },
  historyScroll: {
    width: '100%',
  },
  historyScrollContent: {
    gap: scale(14),
    paddingBottom: scale(16),
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    ...theme.shadows.soft,
  },
  historyDateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.kintsugi,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    marginBottom: scale(8),
    ...theme.shadows.tiny,
  },
  historyDateText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.textInverse,
  },
  historyQuestionText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(14),
    color: theme.colors.text,
    lineHeight: scale(20),
    marginBottom: scale(12),
  },
  historyAnswersContainer: {
    gap: scale(8),
    borderTopWidth: theme.borders.subtle,
    borderColor: theme.colors.borderLight,
    paddingTop: scale(10),
  },
  historyAnswerRow: {
    gap: scale(4),
  },
  historyAuthorLabel: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  historyAnswerBody: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(14),
    color: theme.colors.text,
    lineHeight: scale(20),
  },
  historyWaitingNote: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: scale(4),
  },
  historyLockedNote: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: scale(4),
  },
});