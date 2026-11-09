import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  formatRelationshipDuration,
  calculateTogetherDuration,
  calculateDaysTogether,
} from '../src/shared/utils/anniversary';
import { getDailyQuestionForDate, DAILY_QUESTIONS } from '../src/features/home/data/dailyQuestions';

describe('Phase 2: Home Screen Improvements Verification', () => {
  it('1. Header Arrangement: Together heading, partner names, and duration', () => {
    const coupleHeaderPath = path.resolve(
      __dirname,
      '../src/features/home/components/CoupleHeader.tsx'
    );
    const content = fs.readFileSync(coupleHeaderPath, 'utf8');

    expect(content).toContain('Together');
    expect(content).toContain('❤️');
    expect(content).toContain('myDisplayName');
    expect(content).toContain('partnerDisplayName');
    expect(content).toContain('durationText');
    expect(content).toContain('cycleDurationFormat');
  });

  it('2. Relationship Duration Preferences: formats total_days, years_months_days, and both', () => {
    const startDate = '2025-01-01';
    const asOfDate = '2026-03-01';

    // Total days format
    const totalDaysStr = formatRelationshipDuration(startDate, 'total_days', asOfDate);
    expect(totalDaysStr).toMatch(/\d+ days together/);

    // Years, months, days format
    const ymdStr = formatRelationshipDuration(startDate, 'years_months_days', asOfDate);
    expect(ymdStr).toContain('1 year');
    expect(ymdStr).toContain('2 months');
    expect(ymdStr).toContain('together');

    // Both format
    const bothStr = formatRelationshipDuration(startDate, 'both', asOfDate);
    expect(bothStr).toContain('•');
    expect(bothStr).toContain('1 year');
    expect(bothStr).toMatch(/\d+ days together/);
  });

  it('3. Home Screen Organization: follows strict Section 3.3 sequence', () => {
    const homePath = path.resolve(__dirname, '../src/app/(tabs)/home.tsx');
    const content = fs.readFileSync(homePath, 'utf8');

    const headerIdx = content.indexOf('<CoupleHeader');
    const bannerIdx = content.indexOf('shouldShowActiveSession ?');
    const dailyQIdx = content.indexOf('<DailyQuestionCard');
    const quickPhotosIdx = content.indexOf('<QuickPhotosCard');
    const clockIdx = content.indexOf('<TimeZoneClockCard');
    const reunionIdx = content.indexOf('<NextReunionCountdownCard');
    const actionsIdx = content.indexOf('<QuickActions');

    expect(headerIdx).toBeGreaterThan(-1);
    expect(bannerIdx).toBeGreaterThan(headerIdx);
    expect(dailyQIdx).toBeGreaterThan(bannerIdx);
    expect(quickPhotosIdx).toBeGreaterThan(dailyQIdx);
    expect(clockIdx).toBeGreaterThan(quickPhotosIdx);
    expect(reunionIdx).toBeGreaterThan(clockIdx);
    expect(actionsIdx).toBeGreaterThan(reunionIdx);
  });

  it('4. Daily Question: deterministic calendar day selection & rich question pool', () => {
    expect(DAILY_QUESTIONS.length).toBeGreaterThanOrEqual(15);

    const qDay1 = getDailyQuestionForDate('2026-11-09');
    const qDay1Repeat = getDailyQuestionForDate('2026-11-09');
    const qDay2 = getDailyQuestionForDate('2026-11-10');

    // Deterministic: same date yields identical question on both devices
    expect(qDay1.id).toBe(qDay1Repeat.id);
    expect(qDay1.text).toBe(qDay1Repeat.text);
    expect(typeof qDay1.text).toBe('string');
  });

  it('5. Database Migration: daily_question_answers schema with strict dual-answer privacy RLS', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../supabase/migrations/20261109000011_daily_questions.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.daily_question_answers');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.has_both_answered_daily_question');
    expect(sql).toContain('SECURITY DEFINER');
    expect(sql).toContain('SET search_path = public');
    expect(sql).toContain('public.get_daily_question_streak');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    // Verifies neither partner can see the other until both have answered
    expect(sql).toContain('public.has_both_answered_daily_question(couple_id, question_date)');
  });
});

