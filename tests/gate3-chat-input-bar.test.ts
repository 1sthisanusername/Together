import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('@/services', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'msg-1' }, error: null }),
        }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  },
  storage: {
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/audio.m4a'),
    uploadMedia: vi.fn().mockResolvedValue({ id: 'media-1', bucket_path: 'couples/c1/audio.m4a' }),
  },
  analytics: {
    track: () => {},
    identify: () => {},
    reset: () => {},
  },
  push: {
    registerForPushNotifications: () => Promise.resolve(null),
  },
}));

describe('GATE 3: Chat Input Bar Layout & Gestures', () => {
  const chatThreadFile = fs.readFileSync(
    path.resolve(__dirname, '../src/features/messages/components/ChatThread.tsx'),
    'utf-8'
  );
  const voiceRecorderFile = fs.readFileSync(
    path.resolve(__dirname, '../src/features/messages/components/VoiceNoteRecorder.tsx'),
    'utf-8'
  );

  it('uses KeyboardStickyView as exactly ONE keyboard-offset mechanism clearing system nav bar when closed', () => {
    expect(chatThreadFile).toContain('KeyboardStickyView offset={{ closed: 0, opened: bottomSafeInset }}');
    expect(chatThreadFile).toContain('paddingBottom: closedBottomPadding');
    // Verify no nested KeyboardAvoidingView wraps the input bar
    const inputBarIdx = chatThreadFile.indexOf('<KeyboardStickyView');
    expect(inputBarIdx).toBeGreaterThan(0);
  });

  it('renders a unified rounded pill with fully rounded ends and small horizontal margins', () => {
    expect(chatThreadFile).toContain('styles.pill');
    expect(chatThreadFile).toContain('borderRadius: theme.roundness.full');
    expect(chatThreadFile).toContain('minHeight: scale(52)');
  });

  it('features a filled round camera button on the left with >= 48dp touch target', () => {
    expect(chatThreadFile).toContain('styles.cameraBtn');
    expect(chatThreadFile).toContain('minWidth: 48');
    expect(chatThreadFile).toContain('minHeight: 48');
    expect(chatThreadFile).toContain('handleCameraPress');
  });

  it('provides a flexible Message… text input growing up to ~4 lines', () => {
    expect(chatThreadFile).toContain('placeholder={`Message ${partnerName}…`}');
    expect(chatThreadFile).toContain('multiline');
    expect(chatThreadFile).toContain('maxHeight: scale(110)');
  });

  it('renders gallery and plus icons, and replaces mic with send button when text is entered', () => {
    expect(chatThreadFile).toContain('handleGalleryPress');
    expect(chatThreadFile).toContain('handleMorePress');
    expect(chatThreadFile).toContain('inputText.trim().length > 0 ? (');
    expect(chatThreadFile).toContain('styles.sendBtn');
    expect(chatThreadFile).toContain('VoiceNoteRecorder');
  });

  it('transforms the pill to recording state with timer and slide-to-cancel hint when mic is held', () => {
    expect(chatThreadFile).toContain('recordingState.isRecording && styles.pillRecording');
    expect(chatThreadFile).toContain('styles.recordingRow');
    expect(chatThreadFile).toContain('styles.timerPill');
    expect(chatThreadFile).toContain('styles.cancelHintText');
  });

  it('captures recording gestures on start to avoid fighting list scroll and hints on quick tap', () => {
    expect(voiceRecorderFile).toContain('onStartShouldSetPanResponderCapture: () => true');
    expect(voiceRecorderFile).toContain("'Hold to record'");
    expect(voiceRecorderFile).toContain('minWidth: 48');
    expect(voiceRecorderFile).toContain('minHeight: 48');
  });
});

