import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateBackupArchive,
  restoreBackupArchive,
  type CoupleBackupArchive,
  GOOGLE_DRIVE_APPDATA_SCOPE,
} from '@/features/settings/services/googleDriveBackup';
import { offlineQueue, type QueuedMutation } from '@/services/offlineQueue';

describe('Phase 5: Local-First Offline Architecture & Cloud Backup Sync', () => {
  beforeEach(async () => {
    await offlineQueue.clear();
  });

  describe('Google Drive Cloud Backup & Validation', () => {
    it('uses the isolated Google Drive appdata scope', () => {
      expect(GOOGLE_DRIVE_APPDATA_SCOPE).toBe('https://www.googleapis.com/auth/drive.appdata');
    });

    it('validates a well-formed Together couple archive', () => {
      const validArchive: CoupleBackupArchive = {
        app: 'together',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        coupleId: 'c-123',
        stats: {
          lettersCount: 2,
          memoriesCount: 3,
          vaultItemsCount: 1,
        },
        data: {
          letters: [{ id: 'l1', title: 'Love letter' }],
          memories: [{ id: 'm1', caption: 'Beach trip' }],
          vaultItems: [{ id: 'v1', content: 'Our secret' }],
        },
      };

      const result = validateBackupArchive(JSON.stringify(validArchive));
      expect(result.app).toBe('together');
      expect(result.data.letters).toHaveLength(1);
      expect(result.data.memories).toHaveLength(1);
      expect(result.data.vaultItems).toHaveLength(1);
    });

    it('rejects an archive from a foreign app', () => {
      const foreignJson = JSON.stringify({
        app: 'other-app',
        version: '1.0.0',
        data: {},
      });

      expect(() => validateBackupArchive(foreignJson)).toThrow(
        'Unsupported backup file. Expected "together" archive.'
      );
    });

    it('rejects corrupted or malformed archives', () => {
      expect(() => validateBackupArchive('not-json')).toThrow(
        'Invalid JSON format in backup file.'
      );

      const missingData = JSON.stringify({ app: 'together', version: '1.0.0' });
      expect(() => validateBackupArchive(missingData)).toThrow(
        'Corrupted backup archive: missing data payload.'
      );
    });

    it('guards against restoring into a mismatched couple account', async () => {
      const archive: CoupleBackupArchive = {
        app: 'together',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        coupleId: 'couple-alice-bob',
        stats: { lettersCount: 1, memoriesCount: 0, vaultItemsCount: 0 },
        data: { letters: [], memories: [], vaultItems: [] },
      };

      await expect(
        restoreBackupArchive(archive, 'couple-charlie-dave')
      ).rejects.toThrow('does not match your active couple ID');
    });
  });

  describe('Offline Mutation Queue', () => {
    it('enqueues mutations and increments pending count', async () => {
      expect(offlineQueue.getPendingCount()).toBe(0);

      await offlineQueue.enqueue('chat_message', {
        coupleId: 'c-1',
        senderId: 'u-1',
        content: 'Hi offline partner',
      });

      await offlineQueue.enqueue('vault_item', {
        coupleId: 'c-1',
        userId: 'u-1',
        content: 'Offline secret note',
      });

      expect(offlineQueue.getPendingCount()).toBe(2);
    });

    it('clears queue when requested', async () => {
      await offlineQueue.enqueue('chat_message', { content: 'test' });
      expect(offlineQueue.getPendingCount()).toBeGreaterThan(0);

      await offlineQueue.clear();
      expect(offlineQueue.getPendingCount()).toBe(0);
    });
  });
});
