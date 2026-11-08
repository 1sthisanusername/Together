import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import type { MediaFile } from '@/shared/types';

/**
 * Shared media upload helper
 * Reads the file as base64 via expo-file-system, decodes to ArrayBuffer,
 * uploads to private 'couples-media' storage bucket with explicit contentType,
 * and verifies that stored size > 0.
 */
export async function uploadMedia(
  uri: string,
  mime: string,
  path: string
): Promise<{ path: string; size: number }> {
  // 1. Read file as base64
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64Data || base64Data.length === 0) {
    throw new Error('Recorded file or media is empty (0 bytes).');
  }

  // 2. Decode to ArrayBuffer
  const arrayBuffer = decode(base64Data);
  const size = arrayBuffer.byteLength;
  if (size <= 0) {
    throw new Error('Decoded media payload is empty (0 bytes).');
  }

  if (size > 10 * 1024 * 1024) {
    throw new Error('File exceeds the 10 MB maximum limit');
  }

  // 3. Upload with explicit contentType to couples-media bucket
  const { data, error } = await supabase.storage
    .from('couples-media')
    .upload(path, arrayBuffer, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    path: data?.path || path,
    size,
  };
}

export interface UploadOptions {
  coupleId: string;
  userId: string;
  uri?: string;
  fileBytes?: Uint8Array | Blob;
  mimeType: string;
  fileName: string;
  durationSeconds?: number;
}

export interface StorageService {
  uploadMedia: (options: UploadOptions) => Promise<MediaFile>;
  getSignedUrl: (bucketPath: string, expiresInSeconds?: number) => Promise<string | null>;
  deleteMedia: (bucketPath: string) => Promise<void>;
}

class AppStorageService implements StorageService {
  private bucketName = 'couples-media';
  private maxSizeBytes = 10 * 1024 * 1024; // 10 MB limit (Section 5)

  async uploadMedia({
    coupleId,
    userId,
    uri,
    fileBytes,
    mimeType,
    fileName,
    durationSeconds,
  }: UploadOptions): Promise<MediaFile> {
    const ext = fileName.split('.').pop() || (mimeType.includes('audio') ? 'm4a' : 'jpg');
    const filePath = `${coupleId}/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    let storedSize = 0;

    if (uri) {
      // Use standard uploadMedia base64 -> ArrayBuffer pipeline
      const uploadResult = await uploadMedia(uri, mimeType, filePath);
      storedSize = uploadResult.size;
    } else if (fileBytes) {
      const size = fileBytes instanceof Blob ? fileBytes.size : fileBytes.byteLength;
      if (size === 0) {
        throw new Error('Recorded file or media is empty (0 bytes).');
      }
      if (size > this.maxSizeBytes) {
        throw new Error('File exceeds the 10 MB maximum limit');
      }

      // 1. Upload to private storage bucket with explicit mimeType
      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBytes, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload media: ${uploadError.message}`);
      }
      storedSize = size;
    } else {
      throw new Error('Either uri or fileBytes must be provided to uploadMedia');
    }

    if (storedSize <= 0) {
      throw new Error('Stored size must be greater than 0.');
    }

    // 2. Insert into media_files table (Section 3.8)
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_files')
      .insert({
        couple_id: coupleId,
        owner_id: userId,
        bucket_path: filePath,
        mime_type: mimeType,
        file_size: storedSize,
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

  async deleteMedia(bucketPath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([bucketPath]);

    if (error) {
      console.warn('Error deleting storage file:', error.message);
    }
  }
}

export const storage = new AppStorageService();
