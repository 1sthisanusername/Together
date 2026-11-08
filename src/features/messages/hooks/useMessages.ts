import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, storage, analytics, push } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type {
  ChatMessage,
  SendTextMessageParams,
  SendVoiceNoteParams,
  SendPhotoMessageParams,
} from '../types';
import type { MediaFile } from '@/shared/types';

export function useMessages() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  const queryKey = ['messages', coupleId];

  const query = useQuery<ChatMessage[]>({
    queryKey,
    enabled: !!coupleId && !!user?.id,
    queryFn: async () => {
      if (!coupleId) return [];

      // 1. Fetch non-deleted messages
      const { data: rawMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', coupleId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (msgError) throw new Error(msgError.message);
      if (!rawMessages || rawMessages.length === 0) return [];

      // 2. Fetch media files for voice notes
      const mediaIds = rawMessages
        .map((m) => m.media_id)
        .filter((id): id is string => typeof id === 'string');

      const mediaMap = new Map<string, MediaFile>();

      if (mediaIds.length > 0) {
        const { data: mediaRows } = await supabase
          .from('media_files')
          .select('*')
          .in('id', mediaIds);

        mediaRows?.forEach((row) => mediaMap.set(row.id, row as MediaFile));
      }

      // 3. Resolve signed URLs for voice notes
      const enriched: ChatMessage[] = await Promise.all(
        rawMessages.map(async (msg) => {
          let signedUrl: string | null = null;
          let mediaObj: MediaFile | null = null;

          if (msg.media_id && mediaMap.has(msg.media_id)) {
            const media = mediaMap.get(msg.media_id)!;
            mediaObj = media;
            signedUrl = await storage.getSignedUrl(media.bucket_path, 3600);
          }

          return {
            ...msg,
            media: mediaObj,
            mediaSignedUrl: signedUrl,
            status: 'sent' as const,
          };
        })
      );

      return enriched;
    },
  });

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!coupleId || !user?.id) return;

    const channelName = `chat_messages_${coupleId}_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            if (newRow.deleted_at) return;

            let signedUrl: string | null = null;
            if (newRow.media_id) {
              const { data: media } = await supabase
                .from('media_files')
                .select('bucket_path')
                .eq('id', newRow.media_id)
                .maybeSingle();

              if (media?.bucket_path) {
                signedUrl = await storage.getSignedUrl(media.bucket_path, 3600);
              }
            }

            const newMsg: ChatMessage = {
              ...newRow,
              mediaSignedUrl: signedUrl,
              status: 'sent',
            };

            queryClient.setQueryData<ChatMessage[]>(queryKey, (prev = []) => {
              // Avoid duplicate if optimistic message matches idempotency_key or id
              const exists = prev.some(
                (m) =>
                  m.id === newMsg.id ||
                  (m.idempotency_key && m.idempotency_key === newMsg.idempotency_key)
              );
              if (exists) {
                return prev.map((m) =>
                  m.idempotency_key === newMsg.idempotency_key ? newMsg : m
                );
              }
              return [...prev, newMsg];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as any;
            queryClient.setQueryData<ChatMessage[]>(queryKey, (prev = []) => {
              if (updatedRow.deleted_at) {
                return prev.filter((m) => m.id !== updatedRow.id);
              }
              return prev.map((m) =>
                m.id === updatedRow.id ? { ...m, ...updatedRow } : m
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            queryClient.setQueryData<ChatMessage[]>(queryKey, (prev = []) =>
              prev.filter((m) => m.id !== oldRow.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user?.id, queryClient]);

  return query;
}

export function useSendTextMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  return useMutation({
    mutationFn: async ({ content }: SendTextMessageParams) => {
      if (!user?.id || !coupleId || !partnerId) {
        throw new Error('Not ready to send message');
      }

      const idempotencyKey = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const localId = `local_${Date.now()}`;

      // Optimistic message item
      const optimisticMsg: ChatMessage = {
        id: localId,
        couple_id: coupleId,
        sender_id: user.id,
        recipient_id: partnerId,
        content: content.trim(),
        media_id: null,
        played_at: null,
        deleted_at: null,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        status: 'sending',
        localId,
      };

      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) => [
        ...prev,
        optimisticMsg,
      ]);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          couple_id: coupleId,
          sender_id: user.id,
          recipient_id: partnerId,
          content: content.trim(),
          idempotency_key: idempotencyKey,
        })
        .select('*')
        .single();

      if (error) {
        // Mark as failed in optimistic cache
        queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
          prev.map((m) => (m.localId === localId ? { ...m, status: 'failed' } : m))
        );
        throw new Error(error.message);
      }

      // Replace optimistic message with server row
      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
        prev.map((m) => (m.localId === localId ? { ...data, status: 'sent' } : m))
      );

      // Notification outbox is auto-populated via trg_messages_insert_notify
      analytics.track('message_sent');
      return data;
    },
  });
}

export function useSendVoiceNote() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  return useMutation({
    mutationFn: async ({
      uri,
      fileBytes,
      durationSeconds,
      fileName = 'voice_note.m4a',
    }: SendVoiceNoteParams) => {
      if (!user?.id || !coupleId || !partnerId) {
        throw new Error('Not ready to send voice note');
      }

      const idempotencyKey = `voice_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const localId = `local_voice_${Date.now()}`;

      // 1. Optimistic entry
      const optimisticMsg: ChatMessage = {
        id: localId,
        couple_id: coupleId,
        sender_id: user.id,
        recipient_id: partnerId,
        content: null,
        media_id: null,
        played_at: null,
        deleted_at: null,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        status: 'sending',
        localId,
      };

      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) => [
        ...prev,
        optimisticMsg,
      ]);

      try {
        // 2. Upload voice note to private storage bucket via shared helper
        const mediaFile = await storage.uploadMedia({
          coupleId,
          userId: user.id,
          uri,
          fileBytes,
          mimeType: 'audio/m4a',
          fileName,
          durationSeconds,
        });

        const signedUrl = await storage.getSignedUrl(mediaFile.bucket_path, 3600);

        // 3. Insert message referencing media_files
        const { data, error } = await supabase
          .from('messages')
          .insert({
            couple_id: coupleId,
            sender_id: user.id,
            recipient_id: partnerId,
            content: null,
            media_id: mediaFile.id,
            idempotency_key: idempotencyKey,
          })
          .select('*')
          .single();

        if (error) throw new Error(error.message);

        const fullMsg: ChatMessage = {
          ...data,
          media: mediaFile,
          mediaSignedUrl: signedUrl,
          status: 'sent',
        };

        queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
          prev.map((m) => (m.localId === localId ? fullMsg : m))
        );

        analytics.track('voice_note_sent');
        return fullMsg;
      } catch (err: any) {
        queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
          prev.map((m) => (m.localId === localId ? { ...m, status: 'failed' } : m))
        );
        throw new Error(err.message || 'Failed to send voice note');
      }
    },
  });
}

export function useSendPhotoMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  return useMutation({
    mutationFn: async ({ uri, caption }: SendPhotoMessageParams) => {
      if (!coupleId || !user?.id || !partnerId) throw new Error('Not authenticated');

      const localId = `local_photo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const idempotencyKey = `${user.id}_photo_${Date.now()}`;

      // 1. Upload photo to couples-media bucket
      const mediaFile = await storage.uploadMedia({
        coupleId,
        userId: user.id,
        uri,
        mimeType: 'image/jpeg',
        fileName: 'chat_photo.jpg',
      });

      const signedUrl = await storage.getSignedUrl(mediaFile.bucket_path, 3600);

      // 2. Insert message referencing media_files
      const { data, error } = await supabase
        .from('messages')
        .insert({
          couple_id: coupleId,
          sender_id: user.id,
          recipient_id: partnerId,
          content: caption || null,
          media_id: mediaFile.id,
          idempotency_key: idempotencyKey,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      const fullMsg: ChatMessage = {
        ...data,
        media: mediaFile,
        mediaSignedUrl: signedUrl,
        status: 'sent',
      };

      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) => [
        ...(prev || []),
        fullMsg,
      ]);

      analytics.track('message_sent');
      return fullMsg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', coupleId] });
    },
  });
}

export function useDeleteChatMessage() {
  const queryClient = useQueryClient();
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      // 1. Optimistic removal
      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
        prev.filter((m) => m.id !== messageId)
      );

      // 2. Call delete_message RPC
      const { data, error } = await supabase.rpc('delete_message', {
        p_message_id: messageId,
      });

      if (error) throw new Error(error.message);

      // 3. If storage path returned, clean up from storage bucket
      const bucketPath = (data as any)?.media_bucket_path;
      if (bucketPath) {
        await storage.deleteMedia(bucketPath);
      }

      analytics.track('message_deleted');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', coupleId] });
    },
  });
}

export function useMarkVoicePlayed() {
  const queryClient = useQueryClient();
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      const nowUtc = new Date().toISOString();

      queryClient.setQueryData<ChatMessage[]>(['messages', coupleId], (prev = []) =>
        prev.map((m) => (m.id === messageId ? { ...m, played_at: nowUtc } : m))
      );

      const { data, error } = await supabase
        .from('messages')
        .update({ played_at: nowUtc })
        .eq('id', messageId);

      if (error) throw new Error(error.message);
      return data;
    },
  });
}
