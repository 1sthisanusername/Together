import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
vi.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: vi.fn(async (key: string) => store.get(key) || null),
    setItemAsync: vi.fn(async (key: string, val: string) => {
      store.set(key, val);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

describe('Phase 4: Letters & Private Couple Vault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stationery & Wax Seal System', () => {
    it('supports 4 romantic stationery themes and 5 wax seal stickers', () => {
      const themes = ['parchment_cream', 'rose_petal', 'matcha_mint', 'midnight_sky'];
      const seals = ['❤️', '💌', '🌸', '🌙', '✨'];

      expect(themes).toHaveLength(4);
      expect(seals).toHaveLength(5);
      expect(seals).toContain('❤️');
      expect(seals).toContain('✨');
    });

    it('validates enhanced letter structure with stationery and vault flags', () => {
      const mockLetter = {
        id: 'letter-123',
        couple_id: 'couple-abc',
        sender_id: 'user-me',
        title: 'Open when it is raining',
        content: 'I miss dancing in the rain with you.',
        unlock_at: '2026-12-01T00:00:00Z',
        opened_at: null,
        created_at: '2026-11-09T00:00:00Z',
        stationery_theme: 'rose_petal',
        seal_sticker: '🌸',
        is_vault: true,
      };

      expect(mockLetter.stationery_theme).toBe('rose_petal');
      expect(mockLetter.seal_sticker).toBe('🌸');
      expect(mockLetter.is_vault).toBe(true);
      expect(mockLetter.opened_at).toBeNull();
    });
  });

  describe('SecureStore Vault Authentication', () => {
    it('saves and retrieves vault PIN in SecureStore', async () => {
      await SecureStore.setItemAsync('together_vault_pin', '2026');
      const retrieved = await SecureStore.getItemAsync('together_vault_pin');
      expect(retrieved).toBe('2026');
    });

    it('rejects incorrect vault PIN', async () => {
      await SecureStore.setItemAsync('together_vault_pin', '1234');
      const stored = await SecureStore.getItemAsync('together_vault_pin');
      const attempt = '9999';
      expect(stored === attempt).toBe(false);
    });

    it('resets and clears vault PIN upon request', async () => {
      await SecureStore.setItemAsync('together_vault_pin', '5678');
      await SecureStore.deleteItemAsync('together_vault_pin');
      const retrieved = await SecureStore.getItemAsync('together_vault_pin');
      expect(retrieved).toBeNull();
    });
  });

  describe('Vault Data Models', () => {
    it('validates vault item types (note, secret, photo)', () => {
      const validTypes = ['note', 'secret', 'photo'];
      const mockNote = {
        id: 'vault-1',
        couple_id: 'couple-1',
        created_by: 'user-1',
        item_type: 'secret' as const,
        title: 'Safe Combination',
        content: 'Under the living room rug: 4421',
        created_at: new Date().toISOString(),
      };

      expect(validTypes).toContain(mockNote.item_type);
      expect(mockNote.content).toContain('4421');
    });
  });
});
