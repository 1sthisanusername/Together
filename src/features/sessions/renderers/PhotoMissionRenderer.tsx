import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';
import { storage } from '@/services';
import { theme } from '@/shared/theme';

export interface PhotoMissionProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

// Curated sample snaps for quick testing/demo across web & emulators
const SAMPLE_PHOTOS = [
  { label: '☕ Morning Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop' },
  { label: '🌅 Golden Hour', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop' },
  { label: '🛋️ Cozy Home', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop' },
  { label: '🍕 Dinner Date', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop' },
];

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
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>(SAMPLE_PHOTOS[0].url);
  const [isUploading, setIsUploading] = useState(false);
  const [mySignedUrl, setMySignedUrl] = useState<string | null>(null);
  const [partnerSignedUrl, setPartnerSignedUrl] = useState<string | null>(null);

  const { mutateAsync: submitEventAsync, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  const mySubmission = events.find(
    (e) => e.type === 'photo_submitted' && e.user_id === myUserId
  );
  const partnerSubmission = events.find(
    (e) => e.type === 'photo_submitted' && e.user_id === partnerId
  );

  const isPartnerMasked = (partnerSubmission?.payload as any)?.masked === true;
  const bothSubmitted = !!mySubmission && !!partnerSubmission && !isPartnerMasked;
  const isCompleted = session.status === 'completed';

  const processImageUri = async (uri: string, width?: number, height?: number): Promise<string> => {
    try {
      const actions: ImageManipulator.Action[] = [];
      const w = width || 0;
      const h = height || 0;
      if (w > 1600 || h > 1600) {
        if (w >= h) {
          actions.push({ resize: { width: 1600 } });
        } else {
          actions.push({ resize: { height: 1600 } });
        }
      }
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch {
      return uri;
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to select a mission photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const processedUri = await processImageUri(asset.uri, asset.width, asset.height);
        setSelectedPhotoUrl(processedUri);
      }
    } catch (err: any) {
      console.warn('Gallery pick error:', err);
      Alert.alert('Gallery Error', err?.message || 'Could not select photo from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo for the mission.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const processedUri = await processImageUri(asset.uri, asset.width, asset.height);
        setSelectedPhotoUrl(processedUri);
      }
    } catch (err: any) {
      console.warn('Camera snap error:', err);
      Alert.alert('Camera Error', err?.message || 'Could not capture photo from camera.');
    }
  };

  // Resolve signed URLs when submissions exist
  useEffect(() => {
    let isMounted = true;

    async function loadUrls() {
      if (mySubmission?.payload) {
        const payload = mySubmission.payload as Record<string, any>;
        if (payload.bucket_path) {
          const url = await storage.getSignedUrl(payload.bucket_path);
          if (isMounted) setMySignedUrl(url);
        } else if (payload.photoUrl) {
          if (isMounted) setMySignedUrl(payload.photoUrl);
        }
      }

      if (partnerSubmission?.payload) {
        const payload = partnerSubmission.payload as Record<string, any>;
        if (payload.bucket_path) {
          const url = await storage.getSignedUrl(payload.bucket_path);
          if (isMounted) setPartnerSignedUrl(url);
        } else if (payload.photoUrl) {
          if (isMounted) setPartnerSignedUrl(payload.photoUrl);
        }
      }
    }

    loadUrls();
    return () => {
      isMounted = false;
    };
  }, [mySubmission, partnerSubmission]);

  const handleSubmit = async () => {
    if (isSubmitting || isUploading) return;
    if (mySubmission) {
      Alert.alert('Already Shared', 'You have already shared your photo for this mission!');
      return;
    }
    if (!selectedPhotoUrl) {
      Alert.alert('No Photo Selected', 'Please snap or select a photo first.');
      return;
    }

    try {
      setIsUploading(true);

      let mediaId: string | null = null;
      let bucketPath: string | null = null;

      const isRemote =
        selectedPhotoUrl.startsWith('http://') || selectedPhotoUrl.startsWith('https://');

      if (!isRemote) {
        // Upload local photo via shared storage service
        const mediaFile = await storage.uploadMedia({
          coupleId: session.couple_id,
          userId: myUserId,
          uri: selectedPhotoUrl,
          mimeType: 'image/jpeg',
          fileName: 'mission_photo.jpg',
        });
        mediaId = mediaFile.id;
        bucketPath = mediaFile.bucket_path;
      }

      await submitEventAsync({
        type: 'photo_submitted',
        payload: {
          caption: caption.trim() || 'Shared a candid moment!',
          photoUrl: bucketPath ? null : selectedPhotoUrl,
          media_id: mediaId,
          bucket_path: bucketPath,
          submittedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.warn('Photo mission submission error:', err);
      Alert.alert('Submission Error', err?.message || 'Failed to submit photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>📸</Text>
        <Text style={styles.completedTitle}>Mission Accomplished!</Text>
        <Text style={styles.completedSubtitle}>{config.rewardMessage}</Text>

        {/* Display both revealed photos in completion state */}
        <View style={styles.revealedRow}>
          <View style={styles.polaroidFrame}>
            <Image
              source={{ uri: mySignedUrl || selectedPhotoUrl }}
              style={styles.polaroidImage}
              resizeMode="cover"
            />
            <Text style={styles.polaroidCaption}>
              You: "{(mySubmission?.payload as any)?.caption || 'Our moment'}"
            </Text>
          </View>

          <View style={styles.polaroidFrame}>
            <Image
              source={{
                uri: partnerSignedUrl || SAMPLE_PHOTOS[1].url,
              }}
              style={styles.polaroidImage}
              resizeMode="cover"
            />
            <Text style={styles.polaroidCaption}>
              {partnerName}: "{(partnerSubmission?.payload as any)?.caption || 'So sweet!'}"
            </Text>
          </View>
        </View>

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
          <Text style={styles.sectionSubtitle}>Take or Pick a Photo:</Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.captureActionBtn} onPress={handleTakePhoto}>
              <Text style={styles.captureActionText}>📸 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureActionBtn} onPress={handlePickFromGallery}>
              <Text style={styles.captureActionText}>🖼️ Pick from Gallery</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orPresetsText}>or choose a sample moment:</Text>
          <View style={styles.presetRow}>
            {SAMPLE_PHOTOS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedPhotoUrl(p.url)}
                style={[
                  styles.presetChip,
                  selectedPhotoUrl === p.url && styles.presetChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    selectedPhotoUrl === p.url && styles.presetChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedPhotoUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>

          <Input
            placeholder="Add a sweet caption or note..."
            value={caption}
            onChangeText={setCaption}
          />

          <Button
            title="Snap & Share Photo"
            variant="primary"
            size="lg"
            loading={isSubmitting || isUploading}
            onPress={handleSubmit}
            style={styles.submitBtn}
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

      {/* Simultaneous Reveal Logic */}
      {bothSubmitted ? (
        <View style={styles.revealSection}>
          <View style={styles.revealBanner}>
            <Text style={styles.revealBannerEmoji}>✨</Text>
            <Text style={styles.revealBannerTitle}>Simultaneous Reveal!</Text>
            <Text style={styles.revealBannerSub}>Both of you shared your moments!</Text>
          </View>

          <View style={styles.revealedRow}>
            <View style={styles.polaroidFrame}>
              <Image
                source={{ uri: mySignedUrl || selectedPhotoUrl }}
                style={styles.polaroidImage}
                resizeMode="cover"
              />
              <Text style={styles.polaroidCaption}>
                You: "{(mySubmission?.payload as any)?.caption}"
              </Text>
            </View>

            <View style={styles.polaroidFrame}>
              <Image
                source={{ uri: partnerSignedUrl || (partnerSubmission.payload as any)?.photoUrl || SAMPLE_PHOTOS[1].url }}
                style={styles.polaroidImage}
                resizeMode="cover"
              />
              <Text style={styles.polaroidCaption}>
                {partnerName}: "{(partnerSubmission.payload as any)?.caption}"
              </Text>
            </View>
          </View>
        </View>
      ) : mySubmission && !partnerSubmission ? (
        <Card style={styles.waitingCard}>
          <Text style={styles.waitingLock}>🔒</Text>
          <Text style={styles.waitingTitle}>Photo Locked</Text>
          <Text style={styles.waitingText}>
            Waiting for {partnerName} to submit their photo. Both photos will reveal simultaneously!
          </Text>
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
        </Card>
      ) : partnerSubmission && !mySubmission ? (
        <Card style={styles.partnerReadyCard}>
          <Text style={styles.partnerReadyTitle}>
            ♥ {partnerName} has already submitted their photo!
          </Text>
          <Text style={styles.partnerReadyText}>
            Snap your photo above to unlock the simultaneous reveal!
          </Text>
        </Card>
      ) : null}

      {bothSubmitted ? (
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  captureActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  captureActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  orPresetsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted || '#94A3B8',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  presetChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    marginTop: 8,
  },
  submittedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
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
  revealSection: {
    marginVertical: 12,
  },
  revealBanner: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  revealBannerEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  revealBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7E22CE',
  },
  revealBannerSub: {
    fontSize: 13,
    color: '#9333EA',
    marginTop: 2,
  },
  revealedRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  polaroidFrame: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  polaroidImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  polaroidCaption: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  waitingCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  waitingLock: {
    fontSize: 32,
    marginBottom: 8,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 6,
  },
  waitingText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
  partnerReadyCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  partnerReadyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DB2777',
    marginBottom: 4,
  },
  partnerReadyText: {
    fontSize: 13,
    color: '#9D174D',
    textAlign: 'center',
  },
  completeButton: {
    marginTop: 12,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 24,
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
    marginBottom: 20,
  },
  saveButton: {
    width: '100%',
    marginBottom: 12,
  },
  homeButton: {
    width: '100%',
  },
});
