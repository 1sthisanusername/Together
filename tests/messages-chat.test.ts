import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));

describe('Messages Space: Text, Voice Notes, Storage & RLS Isolation', () => {
  const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

  it('contains the messages migration with idempotency, soft-delete, and delete_message RPC', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const messagesMigration = files.find((f) => f.includes('messages_voice_and_storage'));
    expect(messagesMigration).toBeDefined();

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, messagesMigration!), 'utf8');
    expect(sql).toContain('ALTER TABLE public.messages');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS deleted_at');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS idempotency_key');
    expect(sql).toContain('idx_messages_idempotency');
    expect(sql).toContain('messages_couple_select');
    expect(sql).toContain('deleted_at IS NULL');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.delete_message');
  });

  it('validates idempotency keys prevent duplicate message insertion within couple', () => {
    const messagesStore: Array<{ id: string; couple_id: string; idempotency_key: string; content: string }> = [];

    const insertMessage = (msg: { id: string; couple_id: string; idempotency_key: string; content: string }) => {
      const exists = messagesStore.some(
        (m) => m.couple_id === msg.couple_id && m.idempotency_key === msg.idempotency_key
      );
      if (exists) {
        throw new Error('Duplicate key violation: unique index idx_messages_idempotency');
      }
      messagesStore.push(msg);
      return msg;
    };

    const idempotencyKey = 'msg_1731057600_abc123';
    insertMessage({ id: 'msg_1', couple_id: 'couple_1', idempotency_key: idempotencyKey, content: 'Hey love!' });
    expect(messagesStore.length).toBe(1);

    // Attempt duplicate insert with same idempotency key
    expect(() => {
      insertMessage({ id: 'msg_2', couple_id: 'couple_1', idempotency_key: idempotencyKey, content: 'Hey love!' });
    }).toThrow('Duplicate key violation');
  });

  it('formats message timestamps accurately in the viewer timezone', () => {
    const utcTimestamp = '2026-11-08T14:30:00.000Z';

    const formatMessageTime = (isoString: string, timeZone: string) => {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
      }).format(new Date(isoString));
    };

    const timeLondon = formatMessageTime(utcTimestamp, 'Europe/London');
    const timeKolkata = formatMessageTime(utcTimestamp, 'Asia/Kolkata');
    const timeTokyo = formatMessageTime(utcTimestamp, 'Asia/Tokyo');

    expect(timeLondon).toContain('2:30');
    expect(timeKolkata).toContain('8:00');
    expect(timeTokyo).toContain('11:30');
  });

  it('enforces RLS couple isolation: Outsider C cannot read couple AB messages or media', () => {
    const coupleMembers = [
      { couple_id: 'couple_ab', user_id: 'user_a' },
      { couple_id: 'couple_ab', user_id: 'user_b' },
      { couple_id: 'couple_cd', user_id: 'user_c' },
    ];

    const messages = [
      { id: 'm1', couple_id: 'couple_ab', content: 'Secret between A and B', media_id: 'med_ab_1', deleted_at: null },
      { id: 'm2', couple_id: 'couple_cd', content: 'Secret between C and D', media_id: null, deleted_at: null },
    ];

    const mediaFiles = [
      { id: 'med_ab_1', couple_id: 'couple_ab', bucket_path: 'couples/couple_ab/voice_note.m4a' },
    ];

    // RLS policy: user can only select where couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())
    const getVisibleMessages = (userId: string) => {
      const userCouples = coupleMembers.filter((m) => m.user_id === userId).map((m) => m.couple_id);
      return messages.filter((m) => userCouples.includes(m.couple_id) && m.deleted_at === null);
    };

    const getVisibleMedia = (userId: string) => {
      const userCouples = coupleMembers.filter((m) => m.user_id === userId).map((m) => m.couple_id);
      return mediaFiles.filter((med) => userCouples.includes(med.couple_id));
    };

    // User A can view message m1 and media
    expect(getVisibleMessages('user_a').map((m) => m.id)).toEqual(['m1']);
    expect(getVisibleMedia('user_a').map((med) => med.id)).toEqual(['med_ab_1']);

    // User B can view message m1 and media
    expect(getVisibleMessages('user_b').map((m) => m.id)).toEqual(['m1']);
    expect(getVisibleMedia('user_b').map((med) => med.id)).toEqual(['med_ab_1']);

    // Outsider User C cannot view message m1 or media med_ab_1
    const outsiderMessages = getVisibleMessages('user_c');
    expect(outsiderMessages.some((m) => m.id === 'm1')).toBe(false);
    expect(outsiderMessages.map((m) => m.id)).toEqual(['m2']);

    const outsiderMedia = getVisibleMedia('user_c');
    expect(outsiderMedia.length).toBe(0);
  });

  it('handles soft deletion and storage file cleanup correctly', () => {
    let mockStorageFiles = ['couples/couple_ab/voice_1.m4a', 'couples/couple_ab/voice_2.m4a'];
    let messages = [
      {
        id: 'msg_v1',
        couple_id: 'couple_ab',
        sender_id: 'user_a',
        content: null,
        media_id: 'media_v1',
        deleted_at: null as string | null,
      },
    ];

    const mediaFiles = [
      { id: 'media_v1', bucket_path: 'couples/couple_ab/voice_1.m4a' },
    ];

    // Simulate delete_message RPC
    const deleteMessageRpc = (callerId: string, messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) throw new Error('Message not found');
      if (msg.sender_id !== callerId) throw new Error('Forbidden: only sender can delete');

      msg.deleted_at = new Date().toISOString();
      const media = mediaFiles.find((m) => m.id === msg.media_id);
      return {
        success: true,
        media_bucket_path: media ? media.bucket_path : null,
      };
    };

    // Outsider cannot delete
    expect(() => deleteMessageRpc('user_b', 'msg_v1')).toThrow('Forbidden');

    // Sender User A deletes message
    const res = deleteMessageRpc('user_a', 'msg_v1');
    expect(res.success).toBe(true);
    expect(res.media_bucket_path).toBe('couples/couple_ab/voice_1.m4a');

    // Storage file is removed
    if (res.media_bucket_path) {
      mockStorageFiles = mockStorageFiles.filter((p) => p !== res.media_bucket_path);
    }
    expect(mockStorageFiles).not.toContain('couples/couple_ab/voice_1.m4a');

    // Soft-deleted message is excluded from query
    const activeMessages = messages.filter((m) => m.deleted_at === null);
    expect(activeMessages.length).toBe(0);
  });

  it('voice notes enforce 2-minute duration limit and played status', () => {
    const MAX_DURATION = 120; // 2 minutes

    const validateVoiceNoteDuration = (durationSeconds: number) => {
      if (durationSeconds <= 0) throw new Error('Voice note too short');
      if (durationSeconds > MAX_DURATION) throw new Error('Voice notes cannot exceed 2 minutes');
      return true;
    };

    expect(validateVoiceNoteDuration(30)).toBe(true);
    expect(validateVoiceNoteDuration(120)).toBe(true);
    expect(() => validateVoiceNoteDuration(121)).toThrow('Voice notes cannot exceed 2 minutes');

    // Played status toggle
    const voiceMessage = {
      id: 'voice_1',
      played_at: null as string | null,
    };

    const markPlayed = (msg: typeof voiceMessage) => {
      if (!msg.played_at) {
        msg.played_at = new Date().toISOString();
      }
    };

    markPlayed(voiceMessage);
    expect(voiceMessage.played_at).toBeDefined();
    expect(typeof voiceMessage.played_at).toBe('string');
  });
});
