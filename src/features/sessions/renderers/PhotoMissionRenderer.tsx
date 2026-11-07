import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';

export interface PhotoMissionProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const PhotoMissionRenderer: React.FC<PhotoMissionProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    prompt: string;
    instructions: string;
    rewardMessage: string;
  };

  const [caption, setCaption] = useState('');
  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  const mySubmission = events.find(
    (e) => e.type === 'photo_submitted' && e.user_id === myUserId
  );
  const partnerSubmission = events.find(
    (e) => e.type === 'photo_submitted' && e.user_id === partnerId
  );

  const isCompleted = session.status === 'completed';

  const handleSubmit = () => {
    if (isSubmitting || mySubmission) return;
    submitEvent({
      type: 'photo_submitted',
      payload: {
        caption: caption.trim() || 'Shared a candid moment!',
        submittedAt: new Date().toISOString(),
      },
    });
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>📸</Text>
        <Text style={styles.completedTitle}>Mission Accomplished!</Text>
        <Text style={styles.completedSubtitle}>{config.rewardMessage}</Text>

        <Button
          title={isMemorySaved ? t('sessions.savedToMemories') : t('sessions.saveAsMemory')}
          variant={isMemorySaved ? 'secondary' : 'primary'}
          size="lg"
          disabled={isMemorySaved}
          onPress={() =>
            saveMemory({
              sessionId: session.id,
              title: activity.title,
              note: (mySubmission?.payload as any)?.caption || config.rewardMessage,
            })
          }
          style={styles.saveButton}
        />

        <Button
          title={t('sessions.backToHome')}
          variant="outline"
          size="md"
          onPress={onFinish}
          style={styles.homeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>📸 Photo Mission</Text>
      <Text style={styles.prompt}>{config.prompt}</Text>

      <Card style={styles.instructionCard}>
        <Text style={styles.instructionText}>{config.instructions}</Text>
      </Card>

      {!mySubmission ? (
        <View style={styles.uploadSection}>
          <Input
            placeholder="Add a sweet caption or note..."
            value={caption}
            onChangeText={setCaption}
          />
          <Button
            title="Snap & Share Photo"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      ) : (
        <Card style={styles.submittedCard}>
          <Text style={styles.submittedTitle}>✓ Your Photo is Shared!</Text>
          <Text style={styles.submittedCaption}>
            "{(mySubmission.payload as any)?.caption}"
          </Text>
        </Card>
      )}

      {partnerSubmission ? (
        <Card style={styles.partnerCard}>
          <Text style={styles.partnerTitle}>
            ♥ {partnerName}'s Photo:
          </Text>
          <Text style={styles.partnerCaption}>
            "{(partnerSubmission.payload as any)?.caption}"
          </Text>
        </Card>
      ) : null}

      {mySubmission ? (
        <Button
          title={t('sessions.completeSession')}
          variant="primary"
          size="lg"
          loading={isCompleting}
          onPress={() => completeSession(activity.id)}
          style={styles.completeButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  instructionCard: {
    padding: 18,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 15,
    color: '#0369A1',
    lineHeight: 22,
    textAlign: 'center',
  },
  uploadSection: {
    width: '100%',
  },
  submittedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  submittedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 6,
  },
  submittedCaption: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
  },
  partnerCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  partnerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DB2777',
    marginBottom: 4,
  },
  partnerCaption: {
    fontSize: 15,
    fontWeight: '600',
    color: '#831843',
    fontStyle: 'italic',
  },
  completeButton: {
    marginTop: 12,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 32,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  saveButton: {
    width: '100%',
    marginBottom: 12,
  },
  homeButton: {
    width: '100%',
  },
});

