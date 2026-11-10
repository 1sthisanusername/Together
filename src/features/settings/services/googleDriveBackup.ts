import * as FileSystem from 'expo-file-system/legacy';
import { safeSecureStore as SecureStore } from '@/shared/utils';
import { supabase } from '@/services/supabase';
import { queryClient } from '@/services/queryClient';

export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';
const BACKUP_FREQ_STORAGE_KEY = 'together_backup_frequency';

// Simple content digest checksum (DJB2 hash formatted as hex)
export function computeContentChecksum(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 9.1 Individual User Backup Scope
 * Private device settings, notification preferences, personal draft entries.
 * Stored in user's isolated Google Drive app data (drive.appdata).
 */
export interface IndividualBackupArchive {
  scope: 'individual';
  app: 'together';
  version: '2.0.0';
  userId: string;
  exportedAt: string;
  checksum: string;
  data: {
    userSettings: any | null;
    notificationPreferences: any | null;
    localDrafts?: Record<string, string>;
  };
}

/**
 * 9.2 Couple Shared Backup Scope
 * Shared memories, letters, bucket list, completed activities, daily questions, milestone dates.
 */
export interface CoupleSharedBackupArchive {
  scope?: 'couple_shared';
  app: 'together';
  version: '1.0.0' | '2.0.0' | string;
  coupleId: string;
  exportedAt: string;
  checksum?: string;
  stats: {
    lettersCount: number;
    memoriesCount: number;
    vaultItemsCount: number;
    bucketItemsCount?: number;
    datesCount?: number;
  };
  data: {
    letters: any[];
    memories: any[];
    vaultItems: any[];
    bucketItems?: any[];
    importantDates?: any[];
  };
}

// Backward compatibility interface
export type CoupleBackupArchive = CoupleSharedBackupArchive;

/**
 * Get configured backup frequency (defaults to 'weekly').
 */
export async function getBackupFrequency(): Promise<BackupFrequency> {
  try {
    const val = await SecureStore.getItemAsync(BACKUP_FREQ_STORAGE_KEY);
    if (val === 'daily' || val === 'weekly' || val === 'monthly' || val === 'manual') {
      return val;
    }
  } catch {
    // fallback
  }
  return 'weekly';
}

/**
 * Save configured backup frequency.
 */
export async function setBackupFrequency(frequency: BackupFrequency): Promise<void> {
  await SecureStore.setItemAsync(BACKUP_FREQ_STORAGE_KEY, frequency);
}

/**
 * 9.1 Exports Individual User Backup (device preferences & personal settings).
 */
export async function createIndividualBackup(
  userId: string
): Promise<{ filePath: string; archive: IndividualBackupArchive }> {
  // 1. Fetch user settings
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  // 2. Fetch local drafts if any
  let localDrafts: Record<string, string> = {};
  try {
    const rawDrafts = await SecureStore.getItemAsync(`drafts_${userId}`);
    if (rawDrafts) localDrafts = JSON.parse(rawDrafts);
  } catch {
    // fallback
  }

  const dataPayload = {
    userSettings: userSettings || null,
    notificationPreferences: (userSettings as any)?.notifications_enabled ?? true,
    localDrafts,
  };

  const payloadString = JSON.stringify(dataPayload);
  const checksum = computeContentChecksum(payloadString);

  const archive: IndividualBackupArchive = {
    scope: 'individual',
    app: 'together',
    version: '2.0.0',
    userId,
    exportedAt: new Date().toISOString(),
    checksum,
    data: dataPayload,
  };

  const fileName = `together_user_${userId}_backup.json`;
  const filePath = `${FileSystem.documentDirectory || ''}${fileName}`;

  if (FileSystem.documentDirectory) {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(archive, null, 2));
  }

  return { filePath, archive };
}

/**
 * 9.2 Exports Couple Shared Backup (letters, memories, bucket list, dates, vault).
 */
export async function createCoupleSharedBackup(
  coupleId: string
): Promise<{ filePath: string; archive: CoupleSharedBackupArchive }> {
  // 1. Fetch letters
  const { data: letters } = await supabase
    .from('letters')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null);

  // 2. Fetch memories
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null);

  // 3. Fetch bucket list items
  const { data: bucketItems } = await supabase
    .from('bucket_items')
    .select('*')
    .eq('couple_id', coupleId);

  // 4. Fetch important dates
  const { data: importantDates } = await supabase
    .from('important_dates')
    .select('*')
    .eq('couple_id', coupleId);

  // 5. Fetch vault items
  const { data: vaultItems } = await (supabase.from as any)('vault_items')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null);

  const dataPayload = {
    letters: letters || [],
    memories: memories || [],
    bucketItems: bucketItems || [],
    importantDates: importantDates || [],
    vaultItems: vaultItems || [],
  };

  const payloadString = JSON.stringify(dataPayload);
  const checksum = computeContentChecksum(payloadString);

  const archive: CoupleSharedBackupArchive = {
    scope: 'couple_shared',
    app: 'together',
    version: '2.0.0',
    coupleId,
    exportedAt: new Date().toISOString(),
    checksum,
    stats: {
      lettersCount: letters?.length || 0,
      memoriesCount: memories?.length || 0,
      bucketItemsCount: bucketItems?.length || 0,
      datesCount: importantDates?.length || 0,
      vaultItemsCount: vaultItems?.length || 0,
    },
    data: dataPayload,
  };

  const fileName = `together_couple_${coupleId}_backup.json`;
  const filePath = `${FileSystem.documentDirectory || ''}${fileName}`;

  if (FileSystem.documentDirectory) {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(archive, null, 2));
  }

  return { filePath, archive };
}

/**
 * Backward compatibility wrapper for createBackupArchive.
 */
export async function createBackupArchive(
  coupleId: string
): Promise<{ filePath: string; archive: CoupleSharedBackupArchive }> {
  return createCoupleSharedBackup(coupleId);
}

/**
 * Dual Backup Runner: Exports both Individual and Couple backups in one action.
 */
export async function createDualBackup(
  coupleId: string,
  userId: string
): Promise<{
  individual: { filePath: string; archive: IndividualBackupArchive };
  couple: { filePath: string; archive: CoupleSharedBackupArchive };
}> {
  const [individual, couple] = await Promise.all([
    createIndividualBackup(userId),
    createCoupleSharedBackup(coupleId),
  ]);

  return { individual, couple };
}

/**
 * Validates a Couple Shared Backup Archive schema & content checksum.
 */
export function validateCoupleBackupArchive(rawJson: string): CoupleSharedBackupArchive {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid JSON format in backup file.');
  }

  if (parsed.app !== 'together') {
    throw new Error('Unsupported backup file. Expected "together" archive.');
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Corrupted backup archive: missing data payload.');
  }

  if (!Array.isArray(parsed.data.letters) || !Array.isArray(parsed.data.memories)) {
    throw new Error('Invalid backup schema: missing letters or memories array.');
  }

  // Verify content checksum if present
  if (parsed.checksum) {
    const expected = computeContentChecksum(JSON.stringify(parsed.data));
    if (parsed.checksum !== expected) {
      throw new Error('Backup archive checksum mismatch: file may be corrupted.');
    }
  }

  return parsed as CoupleSharedBackupArchive;
}

// Backward-compat alias
export const validateBackupArchive = validateCoupleBackupArchive;

/**
 * Restores a Couple Shared Backup Archive into the Supabase database.
 */
export async function restoreBackupArchive(
  archive: CoupleSharedBackupArchive,
  targetCoupleId: string
): Promise<{ lettersRestored: number; memoriesRestored: number; bucketItemsRestored: number }> {
  if (archive.coupleId && archive.coupleId !== targetCoupleId) {
    throw new Error('Backup couple ID does not match your active couple ID.');
  }

  let lettersRestored = 0;
  let memoriesRestored = 0;
  let bucketItemsRestored = 0;

  // Restore letters
  if (archive.data.letters?.length > 0) {
    const lettersToInsert = archive.data.letters.map((l) => ({
      ...l,
      couple_id: targetCoupleId,
    }));

    const { error } = await (supabase.from('letters') as any).upsert(lettersToInsert, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
    if (!error) lettersRestored = lettersToInsert.length;
  }

  // Restore memories
  if (archive.data.memories?.length > 0) {
    const memoriesToInsert = archive.data.memories.map((m) => ({
      ...m,
      couple_id: targetCoupleId,
    }));

    const { error } = await supabase.from('memories').upsert(memoriesToInsert, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
    if (!error) memoriesRestored = memoriesToInsert.length;
  }

  // Restore bucket items
  if (archive.data.bucketItems && archive.data.bucketItems.length > 0) {
    const bucketToInsert = archive.data.bucketItems.map((b) => ({
      ...b,
      couple_id: targetCoupleId,
    }));

    const { error } = await supabase.from('bucket_items').upsert(bucketToInsert, {
      onConflict: 'id',
      ignoreDuplicates: true,
    });
    if (!error) bucketItemsRestored = bucketToInsert.length;
  }

  // Invalidate queries to refresh UI immediately
  queryClient.invalidateQueries({ queryKey: ['letters', targetCoupleId] });
  queryClient.invalidateQueries({ queryKey: ['memories', targetCoupleId] });
  queryClient.invalidateQueries({ queryKey: ['bucketList', targetCoupleId] });

  return { lettersRestored, memoriesRestored, bucketItemsRestored };
}
