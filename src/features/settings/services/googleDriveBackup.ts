import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/services/supabase';
import { queryClient } from '@/services/queryClient';

export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export interface BackupData {
  letters: any[];
  memories: any[];
  vaultItems: any[];
}

export interface CoupleBackupArchive {
  app: 'together';
  version: '1.0.0';
  exportedAt: string;
  coupleId: string;
  stats: {
    lettersCount: number;
    memoriesCount: number;
    vaultItemsCount: number;
  };
  data: BackupData;
}

/**
 * Exports all couple letters, memories, and vault items into a standardized backup archive.
 */
export async function createBackupArchive(
  coupleId: string
): Promise<{ filePath: string; archive: CoupleBackupArchive }> {
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

  // 3. Fetch vault items
  const { data: vaultItems } = await (supabase.from as any)('vault_items')
    .select('*')
    .eq('couple_id', coupleId)
    .is('deleted_at', null);

  const archive: CoupleBackupArchive = {
    app: 'together',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    coupleId,
    stats: {
      lettersCount: letters?.length || 0,
      memoriesCount: memories?.length || 0,
      vaultItemsCount: vaultItems?.length || 0,
    },
    data: {
      letters: letters || [],
      memories: memories || [],
      vaultItems: vaultItems || [],
    },
  };

  const fileName = `together_backup_${Date.now()}.json`;
  const filePath = `${FileSystem.documentDirectory || ''}${fileName}`;

  if (FileSystem.documentDirectory) {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(archive, null, 2));
  }

  return { filePath, archive };
}

/**
 * Validates a backup archive's schema and structure before restore.
 */
export function validateBackupArchive(rawJson: string): CoupleBackupArchive {
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

  if (
    !Array.isArray(parsed.data.letters) ||
    !Array.isArray(parsed.data.memories) ||
    !Array.isArray(parsed.data.vaultItems)
  ) {
    throw new Error('Corrupted backup archive: invalid collection types.');
  }

  return parsed as CoupleBackupArchive;
}

/**
 * Restores couple data from a validated archive safely.
 */
export async function restoreBackupArchive(
  archive: CoupleBackupArchive,
  targetCoupleId: string
): Promise<{ restoredLetters: number; restoredMemories: number; restoredVaultItems: number }> {
  if (archive.coupleId && archive.coupleId !== targetCoupleId) {
    throw new Error(
      `Backup couple ID (${archive.coupleId}) does not match your active couple ID (${targetCoupleId}).`
    );
  }

  let restoredLetters = 0;
  let restoredMemories = 0;
  let restoredVaultItems = 0;

  // 1. Restore letters
  if (archive.data.letters.length > 0) {
    for (const letter of archive.data.letters) {
      const { error } = await supabase.from('letters').upsert({
        ...letter,
        couple_id: targetCoupleId,
      });
      if (!error) restoredLetters++;
    }
  }

  // 2. Restore memories
  if (archive.data.memories.length > 0) {
    for (const memory of archive.data.memories) {
      const { error } = await supabase.from('memories').upsert({
        ...memory,
        couple_id: targetCoupleId,
      });
      if (!error) restoredMemories++;
    }
  }

  // 3. Restore vault items
  if (archive.data.vaultItems.length > 0) {
    for (const item of archive.data.vaultItems) {
      const { error } = await (supabase.from as any)('vault_items').upsert({
        ...item,
        couple_id: targetCoupleId,
      });
      if (!error) restoredVaultItems++;
    }
  }

  // Invalidate queries so UI reflects restored data immediately
  queryClient.invalidateQueries({ queryKey: ['letters'] });
  queryClient.invalidateQueries({ queryKey: ['memories'] });
  queryClient.invalidateQueries({ queryKey: ['vault_items'] });

  return { restoredLetters, restoredMemories, restoredVaultItems };
}
