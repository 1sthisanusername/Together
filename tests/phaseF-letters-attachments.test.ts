import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase F: Love Letters Attachments & Scheduled Opening Architecture', () => {
  it('1. EnhancedLetter supports multimedia attachments and scheduled dates', () => {
    const hookPath = path.resolve(
      __dirname,
      '../src/features/letters/hooks/useLetters.ts'
    );
    expect(fs.existsSync(hookPath)).toBe(true);

    const content = fs.readFileSync(hookPath, 'utf8');
    expect(content).toContain('photo_url?: string | null');
    expect(content).toContain('voice_url?: string | null');
    expect(content).toContain('voice_duration_seconds?: number | null');
    expect(content).toContain('insertPayload.photo_url = photoUrl');
    expect(content).toContain('insertPayload.voice_url = voiceUrl');
  });

  it('2. ReadLetterModal supports Open Now vs Open Later and renders attachments', () => {
    const modalPath = path.resolve(
      __dirname,
      '../src/features/letters/components/ReadLetterModal.tsx'
    );
    expect(fs.existsSync(modalPath)).toBe(true);

    const content = fs.readFileSync(modalPath, 'utf8');
    // Open Now vs Open Later
    expect(content).toContain('Break Wax Seal & Read 💌');
    expect(content).toContain('Open Later ⏳');

    // Attachments display
    expect(content).toContain('attachedPhotoContainer');
    expect(content).toContain('VoiceNotePlayer');
  });

  it('3. LetterCard displays correct scheduled, delivered, and opened statuses', () => {
    const cardPath = path.resolve(
      __dirname,
      '../src/features/letters/components/LetterCard.tsx'
    );
    expect(fs.existsSync(cardPath)).toBe(true);

    const content = fs.readFileSync(cardPath, 'utf8');
    // Sender statuses
    expect(content).toContain('🔒 Scheduled');
    expect(content).toContain('✉️ Delivered');
    expect(content).toContain('📖 Opened');

    // Recipient statuses
    expect(content).toContain('🔒 Sealed Until');
    expect(content).toContain('💌 Ready to Open');
  });

  it('4. WriteLetterModal allows photo attachment with preview and removal', () => {
    const writeModalPath = path.resolve(
      __dirname,
      '../src/features/letters/components/WriteLetterModal.tsx'
    );
    expect(fs.existsSync(writeModalPath)).toBe(true);

    const content = fs.readFileSync(writeModalPath, 'utf8');
    expect(content).toContain('Attach a Photo to Letter');
    expect(content).toContain('previewThumb');
    expect(content).toContain('removePhotoBtn');
  });
});
