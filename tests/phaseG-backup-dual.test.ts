import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('expo-secure-store', () => import('./mocks/expo-secure-store'));

import {
  computeContentChecksum,
  validateCoupleBackupArchive,
  getBackupFrequency,
  setBackupFrequency,
  GOOGLE_DRIVE_APPDATA_SCOPE,
} from '../src/features/settings/services/googleDriveBackup';

describe('Phase G: Dual Google Drive Backup Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. GOOGLE_DRIVE_APPDATA_SCOPE points to isolated appdata scope', () => {
    expect(GOOGLE_DRIVE_APPDATA_SCOPE).toBe('https://www.googleapis.com/auth/drive.appdata');
  });

  it('2. computeContentChecksum generates deterministic content hash', () => {
    const data = JSON.stringify({ test: 'sample', number: 42 });
    const hash1 = computeContentChecksum(data);
    const hash2 = computeContentChecksum(data);

    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(8);

    const corruptedHash = computeContentChecksum(JSON.stringify({ test: 'corrupted' }));
    expect(hash1).not.toBe(corruptedHash);
  });

  it('3. Backup frequency defaults to weekly and persists frequency changes', async () => {
    const defaultFreq = await getBackupFrequency();
    expect(defaultFreq).toBe('weekly');

    await setBackupFrequency('monthly');
    const updated = await getBackupFrequency();
    expect(updated).toBe('monthly');
  });

  it('4. validateCoupleBackupArchive validates structure and verifies checksum', () => {
    const validData = {
      letters: [{ id: 'l1', title: 'Test Letter' }],
      memories: [{ id: 'm1', title: 'First Date' }],
      bucketItems: [{ id: 'b1', title: 'Trip to Tokyo' }],
      importantDates: [],
      vaultItems: [],
    };
    const checksum = computeContentChecksum(JSON.stringify(validData));

    const validArchive = {
      scope: 'couple_shared',
      app: 'together',
      version: '2.0.0',
      coupleId: 'couple-123',
      exportedAt: new Date().toISOString(),
      checksum,
      stats: {
        lettersCount: 1,
        memoriesCount: 1,
        bucketItemsCount: 1,
        datesCount: 0,
        vaultItemsCount: 0,
      },
      data: validData,
    };

    const validated = validateCoupleBackupArchive(JSON.stringify(validArchive));
    expect(validated.scope).toBe('couple_shared');
    expect(validated.stats.lettersCount).toBe(1);

    // Corrupted checksum throws error
    const corruptedArchive = {
      ...validArchive,
      checksum: 'badhash0',
    };
    expect(() => validateCoupleBackupArchive(JSON.stringify(corruptedArchive))).toThrow(
      'Backup archive checksum mismatch'
    );
  });
});
