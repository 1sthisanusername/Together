import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/services/supabase';
import { uploadMedia } from '@/services/storage';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { triggerHaptic } from '@/shared/theme';

export function useHomePhoto() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const couple = coupleData?.couple;

  return {
    homePhotoUrl: couple?.home_photo_url || null,
    updatedAt: couple?.home_photo_updated_at || null,
    updatedBy: couple?.home_photo_updated_by || null,
    isSetByMe: couple?.home_photo_updated_by === user?.id,
  };
}

export function useUpdateHomePhoto() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (!user?.id || !coupleId) {
        throw new Error('Not connected as a couple');
      }

      // 1. Resize and compress to reasonable resolution for home hero display (max width 1200, 80% JPEG)
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Upload to couples-media bucket
      const filePath = `${coupleId}/home_photo/${Date.now()}_cover.jpg`;
      const uploadRes = await uploadMedia(manipulated.uri, 'image/jpeg', filePath);

      // 3. Get signed URL for the uploaded photo (valid for 1 year)
      const { data: signedData, error: signError } = await supabase.storage
        .from('couples-media')
        .createSignedUrl(uploadRes.path, 60 * 60 * 24 * 365);

      if (signError || !signedData?.signedUrl) {
        throw new Error('Failed to generate secure URL for home photo');
      }

      const photoUrl = signedData.signedUrl;

      // 4. Update couples record
      const { error: updateError } = await (supabase.from as any)('couples')
        .update({
          home_photo_url: photoUrl,
          home_photo_updated_at: new Date().toISOString(),
          home_photo_updated_by: user.id,
        })
        .eq('id', coupleId);

      if (updateError) {
        throw new Error(`Failed to update home photo: ${updateError.message}`);
      }

      triggerHaptic('success');
      return photoUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCouple'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}
