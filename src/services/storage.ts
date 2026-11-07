import { supabase } from './supabase';
import type { MediaFile } from '@/shared/types';

export interface UploadOptions {
  coupleId: string;
  userId: string;
  fileBytes: Uint8Array | Blob;
  mimeType: string;
  fileName: string;
  durationSeconds?: number;
}

export interface StorageService {
  uploadMedia: (options: UploadOptions) => Promise<MediaFile>;
  getSignedUrl: (bucketPath: string, expiresInSeconds?: number) => Promise<string | null>;
}

class AppStorageService implements StorageService {
  private bucketName = 'couples-media';
  private maxSizeBytes = 10 * 1024 * 1024; // 10 MB limit (Section 5)

  async uploadMedia({
    coupleId,
    userId,
    fileBytes,
    mimeType,
    fileName,
    durationSeconds,
  }: UploadOptions): Promise<MediaFile> {
    const size = fileBytes instanceof Blob ? fileBytes.size : fileBytes.byteLength;
    if (size > this.maxSizeBytes) {
      throw new Error('File exceeds the 10 MB maximum limit');
    }

    const ext = fileName.split('.').pop() || 'dat';
    const filePath = `${coupleId}/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // 1. Upload to private storage bucket
    const { error: uploadError } = await supabase.storage
      .from(this.bucketName)
      .upload(filePath, fileBytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload media: ${uploadError.message}`);
    }

    // 2. Insert into media_files table (Section 3.8)
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_files')
      .insert({
        couple_id: coupleId,
        owner_id: userId,
        bucket_path: filePath,
        mime_type: mimeType,
        file_size: size,
        duration_seconds: durationSeconds ?? null,
      })
      .select('*')
      .single();

    if (dbError || !mediaRecord) {
      throw new Error(`Failed to register media: ${dbError?.message}`);
    }

    return mediaRecord;
  }

  async getSignedUrl(bucketPath: string, expiresInSeconds = 3600): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(bucketPath, expiresInSeconds);

    if (error) {
      console.warn('Error creating signed URL:', error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  }
}

export const storage = new AppStorageService();

