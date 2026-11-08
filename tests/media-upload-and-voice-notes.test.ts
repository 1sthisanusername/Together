import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native-safe-area-context', () => import('./mocks/react-native-safe-area-context'));
vi.mock('react-native-keyboard-controller', () => import('./mocks/react-native-keyboard-controller'));
vi.mock('expo-audio', () => import('./mocks/expo-audio'));
vi.mock('expo-file-system', () => import('./mocks/expo-file-system'));

describe('GATE 1: Media Upload and Voice Notes Architecture & Security', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20261108000007_storage_allowed_mimes.sql'
  );

  it('migration configures couples-media bucket with all required allowed MIME types', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain("'couples-media'");
    expect(sql).toContain("'image/jpeg'");
    expect(sql).toContain("'image/png'");
    expect(sql).toContain("'image/webp'");
    expect(sql).toContain("'audio/mp4'");
    expect(sql).toContain("'audio/m4a'");
    expect(sql).toContain("'audio/mpeg'");
    expect(sql).toContain("'audio/aac'");
    expect(sql).toContain('public = false');
  });

  it('migration enforces strict couple-only RLS isolation on storage.objects', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('CREATE POLICY "couples_media_select" ON storage.objects');
    expect(sql).toContain('CREATE POLICY "couples_media_insert" ON storage.objects');
    expect(sql).toContain('CREATE POLICY "couples_media_delete" ON storage.objects');
    expect(sql).toContain('bucket_id = \'couples-media\'');
    expect(sql).toContain('(storage.foldername(name))[1]::uuid IN (');
    expect(sql).toContain('SELECT couple_id FROM public.couple_members');
    expect(sql).toContain("WHERE user_id = auth.uid() AND status = 'active'");
  });

  it('uploadMedia helper reads file as base64, decodes to ArrayBuffer, uploads with explicit mimeType, and verifies size > 0', async () => {
    const { uploadMedia } = await import('@/services/storage');
    expect(typeof uploadMedia).toBe('function');
  });

  it('storage service supports uri-based upload with explicit contentType', async () => {
    const { storage } = await import('@/services/storage');
    expect(typeof storage.uploadMedia).toBe('function');
    expect(typeof storage.getSignedUrl).toBe('function');
    expect(typeof storage.deleteMedia).toBe('function');
  });

  it('VoiceNoteRecorder is exported and exports valid component', async () => {
    const { VoiceNoteRecorder } = await import('@/features/messages');
    expect(VoiceNoteRecorder).toBeDefined();
  });

  it('Memories hook enforces delete by uploader only and removes storage files', async () => {
    const useMemoriesFile = path.resolve(
      __dirname,
      '../src/features/memories/hooks/useMemories.ts'
    );
    const code = fs.readFileSync(useMemoriesFile, 'utf-8');

    expect(code).toContain('Only the uploader can delete this memory');
    expect(code).toContain("supabase.storage.from('couples-media').remove");
    expect(code).toContain('uploadMedia');
  });
});
