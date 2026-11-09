import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as SecureStore from 'expo-secure-store';
import {
  getBackupFrequency,
  setBackupFrequency,
  createDualBackup,
} from '@/features/settings/services/googleDriveBackup';

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/test/documents/',
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
}));

describe('Phase H: Polish & History Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await SecureStore.deleteItemAsync('together_backup_frequency');
  });

  describe('Backup Frequency Configuration', () => {
    it('defaults to weekly frequency', async () => {
      const freq = await getBackupFrequency();
      expect(freq).toBe('weekly');
    });

    it('persists and retrieves monthly and manual frequency', async () => {
      await setBackupFrequency('monthly');
      expect(await getBackupFrequency()).toBe('monthly');

      await setBackupFrequency('manual');
      expect(await getBackupFrequency()).toBe('manual');
    });

    it('creates dual backup with isolated individual and couple archives', async () => {
      const result = await createDualBackup('couple_abc', 'user_123');
      expect(result.individual.archive.scope).toBe('individual');
      expect(result.individual.archive.userId).toBe('user_123');
      expect(result.couple.archive.scope).toBe('couple_shared');
      expect(result.couple.archive.coupleId).toBe('couple_abc');
    });
  });
});
