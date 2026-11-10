import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
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
  const [isResolvingPartnerUrl, setIsResolvingPartnerUrl] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<{ uri: string; caption: string } | null>(null);

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

  // Resolve signed URLs when submissions exist and unmasked
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

      if (partnerSubmission?.payload && !isPartnerMasked) {
        const payload = partnerSubmission.payload as Record<string, any>;
        if (payload.bucket_path) {
          setIsResolvingPartnerUrl(true);
          const url = await storage.getSignedUrl(payload.bucket_path);
          if (isMounted) {
            setPartnerSignedUrl(url);
            setIsResolvingPartnerUrl(false);
          }
        } else if (payload.photoUrl) {
          if (isMounted) setPartnerSignedUrl(payload.photoUrl);
        }
      }
    }

    loadUrls();
    return () => {
      isMounted = false;
    };
  }, [mySubmission, partnerSubmission, isPartnerMasked]);

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

  const myFinalPhotoUri = mySignedUrl || selectedPhotoUrl;
  const partnerFinalPhotoUri = partnerSignedUrl || (partnerSubmission?.payload as any)?.photoUrl;

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>📸</Text>
        <Text style={styles.completedTitle}>Mission Accomplished!</Text>
        <Text style={styles.completedSubtitle}>{config.rewardMessage}</Text>

        {/* Display both revealed photos in completion state */}
        <View style={styles.revealedRow}>
          <TouchableOpacity
            style={styles.polaroidFrame}
            activeOpacity={0.85}
            onPress={() =>
              myFinalPhotoUri &&
              setFullScreenImage({
                uri: myFinalPhotoUri,
                caption: `You: ${(mySubmission?.payload as any)?.caption || 'Our moment'}`,
              })
            }
          >
            {myFinalPhotoUri ? (
              <Image
                source={{ uri: myFinalPhotoUri }}
                style={styles.polaroidImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.polaroidCaption} numberOfLines={2}>
              You: "{(mySubmission?.payload as any)?.caption || 'Our moment'}"
            </Text>
            <Text style={styles.tapToZoomHint}>🔍 Tap to zoom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.polaroidFrame}
            activeOpacity={0.85}
            onPress={() =>
              partnerFinalPhotoUri &&
              setFullScreenImage({
                uri: partnerFinalPhotoUri,
                caption: `${partnerName}: ${(partnerSubmission?.payload as any)?.caption || 'So sweet!'}`,
              })
            }
          >
            {isResolvingPartnerUrl ? (
              <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : partnerFinalPhotoUri ? (
              <Image
                source={{ uri: partnerFinalPhotoUri }}
                style={styles.polaroidImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Image
                source={{ uri: SAMPLE_PHOTOS[1].url }}
                style={styles.polaroidImage}
                contentFit="cover"
              />
            )}
            <Text style={styles.polaroidCaption} numberOfLines={2}>
              {partnerName}: "{(partnerSubmission?.payload as any)?.caption || 'So sweet!'}"
            </Text>
            <Text style={styles.tapToZoomHint}>🔍 Tap to zoom</Text>
          </TouchableOpacity>
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

        {/* Fullscreen Photo Modal */}
        <Modal visible={!!fullScreenImage} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setFullScreenImage(null)}
            >
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
            {fullScreenImage && (
              <View style={styles.modalContent}>
                <Image
                  source={{ uri: fullScreenImage.uri }}
                  style={styles.modalImage}
                  contentFit="contain"
                />
                <Text style={styles.modalCaption}>{fullScreenImage.caption}</Text>
              </View>
            )}
          </View>
        </Modal>
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

      {/* TOP NOTIFICATION: Partner has already submitted (Mutual Blind Reveal) */}
      {partnerSubmission && !mySubmission ? (
        <Card style={styles.partnerReadyTopCard}>
          <View style={styles.partnerReadyHeader}>
            <Text style={styles.partnerReadyIcon}>💌</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerReadyTitle}>
                {partnerName} has already snapped her view!
              </Text>
              <Text style={styles.partnerReadySubtitle}>
                Her photo is locked for a mutual surprise (like BeReal). Take or select your photo below to unlock both photos together!
              </Text>
            </View>
          </View>

          {/* Locked Polaroid Teaser */}
          <View style={styles.lockedPolaroidTeaser}>
            <View style={styles.lockedPolaroidInner}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedTeaserText}>{partnerName}'s photo is hidden</Text>
              <Text style={styles.lockedTeaserSub}>Unlocks the moment you submit yours</Text>
            </View>
          </View>
        </Card>
      ) : !mySubmission && !partnerSubmission ? (
        <View style={styles.mutualNoticePill}>
          <Text style={styles.mutualNoticeText}>
            🔒 <Text style={{ fontWeight: '700' }}>Mutual Reveal:</Text> Neither of you can see the other's photo until BOTH have submitted!
          </Text>
        </View>
      ) : null}

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
              contentFit="cover"
            />
          </View>

          <Input
            placeholder="Add a sweet caption or note..."
            value={caption}
            onChangeText={setCaption}
          />

          <Button
            title={partnerSubmission ? "Snap & Reveal Both Photos!" : "Snap & Share Photo"}
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
            <TouchableOpacity
              style={styles.polaroidFrame}
              activeOpacity={0.85}
              onPress={() =>
                myFinalPhotoUri &&
                setFullScreenImage({
                  uri: myFinalPhotoUri,
                  caption: `You: ${(mySubmission?.payload as any)?.caption || 'Our moment'}`,
                })
              }
            >
              {myFinalPhotoUri ? (
                <Image
                  source={{ uri: myFinalPhotoUri }}
                  style={styles.polaroidImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              )}
              <Text style={styles.polaroidCaption} numberOfLines={2}>
                You: "{(mySubmission?.payload as any)?.caption}"
              </Text>
              <Text style={styles.tapToZoomHint}>🔍 Tap to zoom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.polaroidFrame}
              activeOpacity={0.85}
              onPress={() =>
                partnerFinalPhotoUri &&
                setFullScreenImage({
                  uri: partnerFinalPhotoUri,
                  caption: `${partnerName}: ${(partnerSubmission?.payload as any)?.caption || 'So sweet!'}`,
                })
              }
            >
              {isResolvingPartnerUrl ? (
                <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : partnerFinalPhotoUri ? (
                <Image
                  source={{ uri: partnerFinalPhotoUri }}
                  style={styles.polaroidImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Image
                  source={{ uri: SAMPLE_PHOTOS[1].url }}
                  style={styles.polaroidImage}
                  contentFit="cover"
                />
              )}
              <Text style={styles.polaroidCaption} numberOfLines={2}>
                {partnerName}: "{(partnerSubmission?.payload as any)?.caption}"
              </Text>
              <Text style={styles.tapToZoomHint}>🔍 Tap to zoom</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={t('sessions.completeSession')}
            variant="primary"
            size="lg"
            loading={isCompleting}
            onPress={() => completeSession(activity.id)}
            style={styles.completeButton}
          />
        </View>
      ) : mySubmission && !partnerSubmission ? (
        <Card style={styles.waitingCard}>
          <Text style={styles.waitingLock}>🔒</Text>
          <Text style={styles.waitingTitle}>Photo Locked</Text>
          <Text style={styles.waitingText}>
            Waiting for {partnerName} to submit their photo. Both photos will reveal simultaneously the instant she submits!
          </Text>
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
        </Card>
      ) : null}

      {/* Fullscreen Photo Modal */}
      <Modal visible={!!fullScreenImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setFullScreenImage(null)}
          >
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: fullScreenImage.uri }}
                style={styles.modalImage}
                contentFit="contain"
              />
              <Text style={styles.modalCaption}>{fullScreenImage.caption}</Text>
            </View>
          )}
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 15,
    color: '#0369A1',
    lineHeight: 22,
    textAlign: 'center',
  },
  partnerReadyTopCard: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FFB6C1',
    borderWidth: 2,
    padding: 16,
    marginBottom: 18,
  },
  partnerReadyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  partnerReadyIcon: {
    fontSize: 28,
  },
  partnerReadyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DB2777',
    marginBottom: 4,
  },
  partnerReadySubtitle: {
    fontSize: 13,
    color: '#831843',
    lineHeight: 18,
  },
  lockedPolaroidTeaser: {
    backgroundColor: '#FFE4E6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPolaroidInner: {
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  lockedTeaserText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 2,
  },
  lockedTeaserSub: {
    fontSize: 12,
    color: '#BE123C',
    fontStyle: 'italic',
  },
  mutualNoticePill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  mutualNoticeText: {
    fontSize: 12,
    color: '#92400E',
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
  imageLoadingBox: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidCaption: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tapToZoomHint: {
    fontSize: 10,
    color: theme.colors.textMuted || '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  modalCaption: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
