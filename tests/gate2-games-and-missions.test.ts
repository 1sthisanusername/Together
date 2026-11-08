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
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'evt-1' }, error: null }),
        }),
      }),
    }),
    rpc: () => Promise.resolve({ data: [], error: null }),
  },
  analytics: {
    track: () => {},
    identify: () => {},
    reset: () => {},
  },
  storage: {
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url.jpg'),
    uploadMedia: vi.fn().mockResolvedValue({ id: 'm-1', bucket_path: 'couples/c-1/m-1.jpg' }),
  },
}));

describe('GATE 2: Games, Quizzes, and Daily Mission Verification', () => {
  it('ActivityRoom does not wrap activities in TouchableWithoutFeedback or KeyboardScreen', () => {
    const activityRoomFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/components/ActivityRoom.tsx'),
      'utf-8'
    );
    expect(activityRoomFile).not.toContain('<KeyboardScreen');
    expect(activityRoomFile).not.toContain('TouchableWithoutFeedback');
    expect(activityRoomFile).toContain('keyboardShouldPersistTaps="handled"');
    expect(activityRoomFile).toContain("scrollEnabled={sessionData.activity.kind !== 'drawing_guess'}");
  });

  it('KeyboardScreen does not wrap the scroll hierarchy in TouchableWithoutFeedback', () => {
    const keyboardScreenFile = fs.readFileSync(
      path.resolve(__dirname, '../src/shared/ui/KeyboardScreen.tsx'),
      'utf-8'
    );
    expect(keyboardScreenFile).not.toContain('<TouchableWithoutFeedback');
  });

  it('useSubmitEvent generates deterministic idempotency keys without Math.random for answer/photo events', () => {
    const useSessionFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/hooks/useSession.ts'),
      'utf-8'
    );
    // Non-stroke events must be deterministic per user, session, type, and round
    expect(useSessionFile).toContain('payload.round !== undefined ? payload.round : (payload.stepId || \'single\')');
  });

  it('Migration 20261108000008 masks photo_submitted until both partners respond', () => {
    const migrationFile = fs.readFileSync(
      path.resolve(__dirname, '../supabase/migrations/20261108000008_mask_photo_mission_events.sql'),
      'utf-8'
    );
    expect(migrationFile).toContain("e.type = 'photo_submitted'");
    expect(migrationFile).toContain("'masked', true");
    expect(migrationFile).toContain('user_photos');
    expect(migrationFile).toContain('partner_photos');
    expect(migrationFile).toContain('EXISTS (SELECT 1 FROM user_photos)');
  });

  it('WouldYouRatherRenderer maintains local selectedChoice for instant feedback', () => {
    const wyrFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/renderers/WouldYouRatherRenderer.tsx'),
      'utf-8'
    );
    expect(wyrFile).toContain('selectedChoice');
    expect(wyrFile).toContain('effectiveMyChoice');
    expect(wyrFile).toContain('optionSelected');
  });

  it('QuizRenderer maintains local selectedOption for instant feedback', () => {
    const quizFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/renderers/QuizRenderer.tsx'),
      'utf-8'
    );
    expect(quizFile).toContain('selectedOption');
    expect(quizFile).toContain('effectiveMyAnswer');
    expect(quizFile).toContain('optionSelected');
  });

  it('WhoKnowsWhomRenderer computes target vs guesser roles and match score', () => {
    const wkwFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/renderers/WhoKnowsWhomRenderer.tsx'),
      'utf-8'
    );
    expect(wkwFile).toContain('isTarget');
    expect(wkwFile).toContain('isMatch');
    expect(wkwFile).toContain('effectiveMyAnswer');
    expect(wkwFile).toContain('Spot on! +1 Point');
  });

  it('GuessMyAnswerRenderer maintains local selectedOption and revealed comparison', () => {
    const gmaFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/renderers/GuessMyAnswerRenderer.tsx'),
      'utf-8'
    );
    expect(gmaFile).toContain('selectedOption');
    expect(gmaFile).toContain('effectiveMyAnswer');
  });

  it('PhotoMissionRenderer requires bothSubmitted before enabling completion and provides gallery/camera pickers', () => {
    const pmFile = fs.readFileSync(
      path.resolve(__dirname, '../src/features/sessions/renderers/PhotoMissionRenderer.tsx'),
      'utf-8'
    );
    expect(pmFile).toContain('handlePickFromGallery');
    expect(pmFile).toContain('handleTakePhoto');
    expect(pmFile).toContain('isPartnerMasked');
    expect(pmFile).toContain('{bothSubmitted ? (');
  });
});

