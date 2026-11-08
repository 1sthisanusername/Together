import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics, uploadMedia } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Memory } from '@/shared/types';

export interface MemoryWithMedia extends Omit<Memory, 'media_ids'> {
  media_ids?: string[] | null;
  photoUrls?: string[];
}

export interface MemoryPhotoItem {
  uri: string;
  mimeType: string;
}

export interface CreateMemoryParams {
  title: string;
  note?: string;
  memoryDate?: string;
  photos?: MemoryPhotoItem[];
  photoUris?: string[];
  onProgress?: (progressPercent: number) => void;
}

/**
 * Upload helper with retry logic (up to 3 attempts)
 */
async function uploadWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, attempt * 800));
      }
    }
  }
  throw lastError;
}

export function useMemories() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<MemoryWithMedia[]>({
    queryKey: ['memories', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async (): Promise<MemoryWithMedia[]> => {
      const coupleId = coupleData!.couple.id;

      // 1. Fetch memories
      const { data: rawMemories, error: memError } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .is('deleted_at', null)
        .order('memory_date', { ascending: false });

      if (memError) throw new Error(memError.message);
      if (!rawMemories || rawMemories.length === 0) return [];
      const memories: MemoryWithMedia[] = rawMemories;

      // 2. Fetch associated media files
      const { data: mediaRows, error: mediaError } = await supabase
        .from('media_files')
        .select('id, memory_id, bucket_path')
        .eq('couple_id', coupleId);

      if (mediaError) {
        console.warn('[useMemories] Failed to fetch media files:', mediaError.message);
        return memories;
      }

      // 3. Generate signed URLs for private photos (1 hour expiry)
      const bucket = supabase.storage.from('couples-media');
      const validPaths = (mediaRows || [])
        .map((m) => m.bucket_path)
        .filter((p): p is string => Boolean(p));

      const signedUrlMap: Record<string, string> = {};
      if (validPaths.length > 0) {
        try {
          const { data: signedData } = await bucket.createSignedUrls(validPaths, 3600);
          if (signedData) {
            for (const item of signedData) {
              if (item.path && item.signedUrl) {
                signedUrlMap[item.path] = item.signedUrl;
              }
            }
          }
        } catch (signErr) {
          console.warn('[useMemories] Failed to create signed URLs:', signErr);
        }
      }

      // 4. Map signed URLs back to each memory
      return memories.map((mem) => {
        const memMedia = (mediaRows || []).filter(
          (m) =>
            m.memory_id === mem.id ||
            m.id === mem.media_id ||
            (mem.media_ids && mem.media_ids.includes(m.id))
        );

        const photoUrls = memMedia
          .map((m) => signedUrlMap[m.bucket_path])
          .filter((url): url is string => Boolean(url));

        return {
          ...mem,
          photoUrls,
        };
      });
    },
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      note,
      memoryDate,
      photos = [],
      photoUris = [],
      onProgress,
    }: CreateMemoryParams) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');
      const coupleId = coupleData.couple.id;

      // 1. Insert base memory row first
      const { data: memory, error: memError } = await supabase
        .from('memories')
        .insert({
          couple_id: coupleId,
          created_by: user.id,
          title,
          note: note || null,
          memory_date: memoryDate || new Date().toISOString().split('T')[0],
          favorite: false,
        })
        .select('*')
        .single();

      if (memError) throw new Error(memError.message);

      // 2. Upload photos if any
      const uploadedMediaIds: string[] = [];
      const normalizedPhotos: MemoryPhotoItem[] = [];

      if (photos && photos.length > 0) {
        normalizedPhotos.push(...photos);
      } else if (photoUris && photoUris.length > 0) {
        for (const uri of photoUris) {
          normalizedPhotos.push({
            uri,
            mimeType: uri.endsWith('.png') ? 'image/png' : uri.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
          });
        }
      }

      const totalPhotos = normalizedPhotos.length;

      for (let i = 0; i < totalPhotos; i++) {
        const photo = normalizedPhotos[i];

        await uploadWithRetry(async () => {
          const mime = photo.mimeType || 'image/jpeg';
          const fileExt = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
          const randomId = Math.random().toString(36).substring(2, 9);
          const filePath = `${coupleId}/memories/${memory.id}_${i}_${randomId}.${fileExt}`;

          // Shared uploadMedia helper: reads as base64, decodes to ArrayBuffer, uploads with explicit contentType
          const uploadResult = await uploadMedia(photo.uri, mime, filePath);

          // Insert media_files row linked to this memory
          const { data: mediaRow, error: mediaInsertError } = await supabase
            .from('media_files')
            .insert({
              couple_id: coupleId,
              owner_id: user.id,
              bucket_path: filePath,
              mime_type: mime,
              file_size: uploadResult.size,
              memory_id: memory.id,
            })
            .select('id')
            .single();

          if (mediaInsertError) throw new Error(mediaInsertError.message);
          uploadedMediaIds.push(mediaRow.id);
        });

        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalPhotos) * 100));
        }
      }

      // 3. Link media IDs to memory
      if (uploadedMediaIds.length > 0) {
        await supabase
          .from('memories')
          .update({
            media_id: uploadedMediaIds[0],
            media_ids: uploadedMediaIds,
          })
          .eq('id', memory.id);
      }

      analytics.track('memory_created');
      return memory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      memoryId,
      createdBy,
    }: {
      memoryId: string;
      createdBy?: string;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      // Rule: Only the uploader can delete
      if (createdBy && createdBy !== user.id) {
        throw new Error('Only the uploader can delete this memory.');
      }

      const coupleId = coupleData.couple.id;

      // 1. Fetch attached media files
      const { data: mediaFiles } = await supabase
        .from('media_files')
        .select('id, bucket_path, owner_id')
        .eq('couple_id', coupleId)
        .eq('memory_id', memoryId);

      // 2. Remove files from storage and delete media_files records
      if (mediaFiles && mediaFiles.length > 0) {
        const filePaths = mediaFiles
          .filter((m) => m.owner_id === user.id)
          .map((m) => m.bucket_path);

        if (filePaths.length > 0) {
          await supabase.storage.from('couples-media').remove(filePaths);
          await supabase
            .from('media_files')
            .delete()
            .eq('memory_id', memoryId)
            .eq('owner_id', user.id);
        }
      }

      // 3. Soft-delete the memory
      const { error: memError } = await supabase
        .from('memories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memoryId)
        .eq('couple_id', coupleId);

      if (memError) throw new Error(memError.message);

      analytics.track('memory_deleted');
      return { memoryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
