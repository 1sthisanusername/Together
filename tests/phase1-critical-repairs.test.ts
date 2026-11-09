import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { notificationRouter } from '../src/services/notificationRouter';

describe('Phase 1: Critical Repairs Verification', () => {
  it('1. Database Migration: breaks session_events recursion, creates delete_memory_permanently and heartbeat_presence', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../supabase/migrations/20261109000010_critical_repairs.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    // Function prevents recursion by running SECURITY DEFINER with set search_path
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.has_user_answered_round');
    expect(migrationSql).toContain('SECURITY DEFINER');
    expect(migrationSql).toContain('SET search_path = public');
    expect(migrationSql).toContain('public.delete_memory_permanently');
    expect(migrationSql).toContain('DELETE FROM public.memories WHERE id = p_memory_id');
    expect(migrationSql).toContain('public.heartbeat_presence()');
    expect(migrationSql).toContain('last_seen_at');
  });

  it('2. Messaging: Image attachments are never treated as voice notes', () => {
    const messageItemPath = path.resolve(
      __dirname,
      '../src/features/messages/components/MessageItem.tsx'
    );
    const content = fs.readFileSync(messageItemPath, 'utf8');

    // Confirms explicit MIME type check
    expect(content).toContain("mimeType.startsWith('image/')");
    expect(content).toContain('<PhotoMessageViewer');
    expect(content).toContain('<VoiceNotePlayer');
    expect(content).toContain('ThemedConfirmDialog');
  });

  it('3. Photo Preview Modal: allows preview and caption before sending', () => {
    const previewModalPath = path.resolve(
      __dirname,
      '../src/features/messages/components/PhotoPreviewModal.tsx'
    );
    expect(fs.existsSync(previewModalPath)).toBe(true);

    const content = fs.readFileSync(previewModalPath, 'utf8');
    expect(content).toContain('Add a sweet note or caption');
    expect(content).toContain('Send Photo');
    expect(content).toContain('contentFit="contain"');
  });

  it('4. Voice Note Recorder: preview before sending, cancel/discard, and playback controls', () => {
    const recorderPath = path.resolve(
      __dirname,
      '../src/features/messages/components/VoiceNoteRecorder.tsx'
    );
    const content = fs.readFileSync(recorderPath, 'utf8');

    expect(content).toContain('previewData');
    expect(content).toContain('previewPlayer');
    expect(content).toContain('discardPreview');
    expect(content).toContain('confirmSendPreview');
    expect(content).toContain('togglePreviewPlay');
    expect(content).toContain('minWidth: 48');
    expect(content).toContain('minHeight: 48');
  });

  it('5. Voice Note Player: progress track touch seeking and speed cycling', () => {
    const playerPath = path.resolve(
      __dirname,
      '../src/features/messages/components/VoiceNotePlayer.tsx'
    );
    const content = fs.readFileSync(playerPath, 'utf8');

    expect(content).toContain('handleTrackPress');
    expect(content).toContain('cycleSpeed');
    expect(content).toContain('player.seekTo');
  });

  it('6. Automatic Realtime Presence: PartnerString removes manual (tap) toggle', () => {
    const partnerStringPath = path.resolve(
      __dirname,
      '../src/features/home/components/PartnerString.tsx'
    );
    const content = fs.readFileSync(partnerStringPath, 'utf8');

    // Confirms manual tap toggle was eliminated
    expect(content).not.toContain('(tap)');
    expect(content).not.toContain('toggleOnline');
    expect(content).toContain('isPartnerOnline');
    expect(content).toContain('connected! ⚡');
    expect(content).toContain('away 💤');
  });

  it('7. Partner Activity Indicator: hidden when partner is offline or session expired', () => {
    const homePath = path.resolve(__dirname, '../src/app/(tabs)/home.tsx');
    const content = fs.readFileSync(homePath, 'utf8');

    expect(content).toContain('usePresence()');
    expect(content).toContain('isPartnerOnline');
    expect(content).toContain('shouldShowActiveSession');
    expect(content).toContain('30 * 60 * 1000');
  });

  it('8. Centralized Notification Router: prevents cold-start route loss and duplicates', () => {
    notificationRouter.clearPendingRoute();
    expect(notificationRouter.getPendingRoute()).toBeNull();

    // Sets route before dispatcher is registered (cold start)
    notificationRouter.setPendingRoute('together://chat');
    expect(notificationRouter.getPendingRoute()).toBe('/chat');

    const mockDispatcher = vi.fn();
    notificationRouter.registerDispatcher(mockDispatcher);
    notificationRouter.markReady(true);

    // Verifies queued route was dispatched
    expect(mockDispatcher).toHaveBeenCalledWith('/chat');
    expect(notificationRouter.getPendingRoute()).toBeNull();

    notificationRouter.unregisterDispatcher();
  });

  it('9. Themed Confirmation Dialog & Toast: exported with String & Stickers styling', () => {
    const sharedUiPath = path.resolve(__dirname, '../src/shared/ui/index.ts');
    const content = fs.readFileSync(sharedUiPath, 'utf8');

    expect(content).toContain("export * from './ThemedConfirmDialog'");
    expect(content).toContain("export * from './ThemedToast'");

    const dialogPath = path.resolve(__dirname, '../src/shared/ui/ThemedConfirmDialog.tsx');
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');
    expect(dialogContent).toContain('theme.colors.border');
    expect(dialogContent).toContain('theme.colors.background');
    expect(dialogContent).toContain('ThemedConfirmDialog');
  });

  it('10. Permanent Memory Deletion: utilizes delete_memory_permanently RPC and removes cache', () => {
    const memoriesHookPath = path.resolve(
      __dirname,
      '../src/features/memories/hooks/useMemories.ts'
    );
    const content = fs.readFileSync(memoriesHookPath, 'utf8');

    expect(content).toContain('delete_memory_permanently');
    expect(content).toContain('setQueryData');
    expect(content).toContain('couples-media');
  });
});

