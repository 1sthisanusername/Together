import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ThemedAlert } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';
import { storage } from '@/services';
import { theme, scale } from '@/shared/theme';

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
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
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
        ThemedAlert.show({
          title: 'Permission Required',
          message: 'Photo library access is needed to select a mission photo.',
        });
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
      ThemedAlert.show({
        title: 'Gallery Error',
        message: err?.message || 'Could not select photo from gallery.',
      });
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        ThemedAlert.show({
          title: 'Permission Required',
          message: 'Camera access is needed to take a photo for the mission.',
        });
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
      ThemedAlert.show({
        title: 'Camera Error',
        message: err?.message || 'Could not capture photo from camera.',
      });
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
      ThemedAlert.show({
        title: 'Already Shared',
        message: 'You have already shared your photo for this mission!',
      });
      return;
    }
    if (!selectedPhotoUrl) {
      ThemedAlert.show({
        title: 'No Photo Selected',
        message: 'Please snap or select a photo first.',
      });
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
      ThemedAlert.show({
        title: 'Submission Error',
        message: err?.message || 'Failed to submit photo. Please try again.',
      });
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
              <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                <Text style={styles.imagePlaceholderIcon}>📸</Text>
              </View>
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

          {selectedPhotoUrl ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedPhotoUrl }}
                style={styles.previewImage}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={styles.noPhotoPlaceholder}>
              <Text style={styles.noPhotoEmoji}>📷</Text>
              <Text style={styles.noPhotoText}>No photo selected yet</Text>
              <Text style={styles.noPhotoSub}>Snap a photo or pick one from your gallery above</Text>
            </View>
          )}

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
                <View style={[styles.polaroidImage, styles.imageLoadingBox]}>
                  <Text style={styles.imagePlaceholderIcon}>📸</Text>
                </View>
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
    padding: scale(16),
    width: '100%',
  },
  badge: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: scale(8),
  },
  prompt: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(16),
    lineHeight: scale(28),
  },
  instructionCard: {
    padding: scale(18),
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    marginBottom: scale(16),
  },
  instructionText: {
    fontSize: scale(15),
    color: theme.colors.text,
    lineHeight: scale(22),
    textAlign: 'center',
  },
  partnerReadyTopCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.rose,
    borderWidth: 1,
    padding: scale(16),
    marginBottom: scale(18),
  },
  partnerReadyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(12),
    marginBottom: scale(12),
  },
  partnerReadyIcon: {
    fontSize: scale(28),
  },
  partnerReadyTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: scale(4),
  },
  partnerReadySubtitle: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    lineHeight: scale(18),
  },
  lockedPolaroidTeaser: {
    backgroundColor: theme.colors.surfaceDisabled,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.rose,
    borderStyle: 'dashed',
    padding: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPolaroidInner: {
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: scale(28),
    marginBottom: scale(6),
  },
  lockedTeaserText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: scale(2),
  },
  lockedTeaserSub: {
    fontSize: scale(12),
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
  mutualNoticePill: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.sunset,
    borderWidth: 1,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    alignItems: 'center',
    marginBottom: scale(16),
  },
  mutualNoticeText: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  uploadSection: {
    width: '100%',
  },
  sectionSubtitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: scale(8),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: scale(12),
  },
  captureActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(8),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  captureActionText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  imagePlaceholderIcon: {
    fontSize: scale(28),
  },
  noPhotoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(14),
    padding: scale(16),
  },
  noPhotoEmoji: {
    fontSize: scale(32),
    marginBottom: scale(6),
  },
  noPhotoText: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(2),
  },
  noPhotoSub: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    marginBottom: scale(14),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    marginTop: scale(8),
  },
  submittedCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    padding: scale(16),
    marginBottom: scale(16),
  },
  submittedTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: scale(6),
  },
  submittedCaption: {
    fontSize: scale(14),
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  revealSection: {
    marginVertical: scale(12),
  },
  revealBanner: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.rose,
    borderWidth: 1,
    borderRadius: theme.roundness.lg,
    padding: scale(14),
    alignItems: 'center',
    marginBottom: scale(14),
  },
  revealBannerEmoji: {
    fontSize: scale(24),
    marginBottom: scale(4),
  },
  revealBannerTitle: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.primary,
  },
  revealBannerSub: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  revealedRow: {
    flexDirection: 'row',
    gap: scale(12),
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  polaroidFrame: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: scale(8),
    paddingBottom: scale(12),
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.roundness.md,
    marginBottom: scale(8),
  },
  imageLoadingBox: {
    backgroundColor: theme.colors.surfaceBlush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidCaption: {
    fontSize: scale(12),
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tapToZoomHint: {
    fontSize: scale(10),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: scale(4),
  },
  waitingCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.sunset,
    alignItems: 'center',
    padding: scale(20),
    marginBottom: scale(16),
  },
  waitingLock: {
    fontSize: scale(32),
    marginBottom: scale(8),
  },
  waitingTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.secondary,
    marginBottom: scale(6),
  },
  waitingText: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
  },
  completeButton: {
    marginTop: scale(12),
  },
  completedContainer: {
    alignItems: 'center',
    padding: scale(24),
  },
  completedEmoji: {
    fontSize: scale(48),
    marginBottom: scale(16),
  },
  completedTitle: {
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  completedSubtitle: {
    fontSize: scale(15),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  saveButton: {
    width: '100%',
    marginBottom: scale(12),
  },
  homeButton: {
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalCloseBtn: {
    position: 'absolute',
    top: scale(50),
    right: scale(20),
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: theme.roundness.full,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(14),
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: scale(480),
    borderRadius: theme.roundness.md,
  },
  modalCaption: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
    marginTop: scale(16),
    textAlign: 'center',
    paddingHorizontal: scale(20),
  },
});
