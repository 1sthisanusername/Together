import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useDailyQuestion, useDailyQuestionHistory } from '../hooks/useDailyQuestion';
import { theme, scale, triggerHaptic } from '@/shared/theme';

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

  if (isLoading || !qData) {
    return (
      <View style={styles.cardWrapper}>
        <View style={styles.cardShadow} />
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
      {/* Hard Ink Shadow */}
      <View style={styles.cardShadow} />

      {/* Paper Surface */}
      <View style={styles.cardSurface}>
        {/* Header Row: Category sticker, Streak & History */}
        <View style={styles.headerRow}>
          <View style={styles.headerBadges}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {question.emoji} Daily Question
              </Text>
            </View>

            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} streak</Text>
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
            <Text style={styles.historyBtnText}>History 📖</Text>
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

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!inputAnswer.trim() || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!inputAnswer.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Answer 💌</Text>
              )}
            </TouchableOpacity>
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
    marginHorizontal: scale(18),
    marginVertical: scale(8),
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.border,
    borderRadius: 20,
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    padding: scale(16),
  },
  centerPadding: {
    paddingVertical: scale(24),
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: theme.typography.families.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  historyBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
  },
  categoryBadge: {
    backgroundColor: theme.colors.stickers.sunshine, // Warm Buttercup
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  categoryText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text,
  },
  streakBadge: {
    backgroundColor: '#FFEAE5',
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  streakText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.danger,
  },
  questionText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(16),
    lineHeight: scale(22),
    color: theme.colors.text,
    marginBottom: scale(14),
  },
  inputForm: {
    gap: scale(10),
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.text,
    minHeight: scale(70),
    textAlignVertical: 'top',
  },
  errorText: {
    color: theme.colors.danger,
    fontFamily: theme.typography.families.bold,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 14,
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hardSm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: '#FFFFFF',
  },
  waitingContainer: {
    gap: scale(10),
  },
  myAnswerPreview: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: scale(12),
  },
  lockedBox: {
    backgroundColor: '#FFF9F0',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: scale(14),
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  lockedTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  lockedSubtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(16),
  },
  unlockedContainer: {
    gap: scale(10),
  },
  celebrationBadge: {
    backgroundColor: theme.colors.stickers.matcha,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingVertical: scale(4),
    alignItems: 'center',
  },
  celebrationText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.text,
  },
  answerCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: scale(12),
  },
  partnerAnswerCard: {
    backgroundColor: '#FFF9F0',
  },
  answerAuthor: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  answerContent: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    lineHeight: scale(20),
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    padding: scale(20),
    ...theme.shadows.hardLg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  modalTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(18),
    color: theme.colors.text,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyLoading: {
    paddingVertical: scale(32),
    alignItems: 'center',
    gap: 8,
  },
  historyLoadingText: {
    fontFamily: theme.typography.families.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  historyEmpty: {
    paddingVertical: scale(32),
    alignItems: 'center',
    gap: 8,
  },
  historyEmptyEmoji: {
    fontSize: 36,
  },
  historyEmptyTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(15),
    color: theme.colors.text,
  },
  historyEmptySubtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(16),
  },
  historyScroll: {
    width: '100%',
  },
  historyScrollContent: {
    gap: scale(12),
    paddingBottom: scale(12),
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: scale(14),
    ...theme.shadows.hardSm,
  },
  historyDateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.stickers.sunshine,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  historyDateText: {
    fontFamily: theme.typography.families.bold,
    fontSize: 11,
    color: theme.colors.text,
  },
  historyQuestionText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
    lineHeight: scale(18),
    marginBottom: 10,
  },
  historyAnswersContainer: {
    gap: 6,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingTop: 8,
  },
  historyAnswerRow: {
    gap: 2,
  },
  historyAuthorLabel: {
    fontFamily: theme.typography.families.bold,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  historyAnswerBody: {
    fontFamily: theme.typography.families.body,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  historyWaitingNote: {
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyLockedNote: {
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

