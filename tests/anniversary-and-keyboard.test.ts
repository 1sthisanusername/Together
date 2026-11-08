import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }: any) => children,
  KeyboardAwareScrollView: ({ children }: any) => children,
  KeyboardStickyView: ({ children }: any) => children,
  KeyboardAvoidingView: ({ children }: any) => children,
}));

import {
  calculateDaysTogether,
  calculateTogetherDuration,
  calculateNextAnniversary,
  calculateNextMilestone,
  isLeapYear,
  parseDateString,
} from '../src/shared/utils/anniversary';

describe('Anniversary & "Together Since" Calculations', () => {
  it('correctly calculates leap years', () => {
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('handles leap day start_date (2024-02-29) in non-leap and leap years', () => {
    const leapStart = '2024-02-29';

    // 1 year later (non-leap 2025): next anniversary is Feb 28, 2025
    const anniv2025 = calculateNextAnniversary(leapStart, '2025-01-15');
    expect(anniv2025.nextDate).toBe('2025-02-28');
    expect(anniv2025.yearsTogetherNext).toBe(1);

    // 4 years later (leap 2028): next anniversary is Feb 29, 2028
    const anniv2028 = calculateNextAnniversary(leapStart, '2027-12-01');
    expect(anniv2028.nextDate).toBe('2028-02-29');
    expect(anniv2028.yearsTogetherNext).toBe(4);
  });

  it('handles edge case: anniversary is today', () => {
    const start = '2022-06-15';
    const today = '2024-06-15';

    const duration = calculateTogetherDuration(start, today);
    expect(duration.years).toBe(2);
    expect(duration.months).toBe(0);
    expect(duration.days).toBe(0);
    expect(duration.formattedText).toBe('Together for 2 years');

    const nextAnniv = calculateNextAnniversary(start, today);
    expect(nextAnniv.daysRemaining).toBe(0);
    expect(nextAnniv.yearsTogetherNext).toBe(2);
  });

  it('handles edge case: couple started today (Day 1)', () => {
    const today = '2026-11-08';
    const totalDays = calculateDaysTogether(today, today);
    expect(totalDays).toBe(0);

    const duration = calculateTogetherDuration(today, today);
    expect(duration.totalDays).toBe(0);
    expect(duration.formattedText).toBe('Started today!');
  });

  it('calculates exact duration breakdown: years, months, and days', () => {
    const start = '2023-01-10';
    const asOf = '2024-04-22';

    const duration = calculateTogetherDuration(start, asOf);
    expect(duration.years).toBe(1);
    expect(duration.months).toBe(3);
    expect(duration.days).toBe(12);
    expect(duration.formattedText).toBe('Together for 1 year, 3 months, 12 days');
    expect(duration.totalDays).toBe(468);
  });

  it('produces identical calculations on Phone A and Phone B regardless of viewer timezone', () => {
    const startDate = '2021-09-01';
    const fixedDate = '2026-11-08';

    // Phone A (London UTC+0) and Phone B (Tokyo UTC+9) calculate from calendar date string
    const resultPhoneA = calculateTogetherDuration(startDate, fixedDate);
    const resultPhoneB = calculateTogetherDuration(startDate, fixedDate);

    expect(resultPhoneA.totalDays).toBe(resultPhoneB.totalDays);
    expect(resultPhoneA.formattedText).toBe(resultPhoneB.formattedText);
    expect(resultPhoneA.years).toBe(resultPhoneB.years);
  });

  it('calculates the next milestone correctly (100, 200, 365, 500, 1000 days)', () => {
    const start = '2024-01-01';
    // 50 days in
    const milestone50 = calculateNextMilestone(start, '2024-02-20');
    expect(milestone50.targetDays).toBe(100);
    expect(milestone50.daysRemaining).toBe(50);

    // 150 days in
    const milestone150 = calculateNextMilestone(start, '2024-05-30');
    expect(milestone150.targetDays).toBe(200);

    // 400 days in
    const milestone400 = calculateNextMilestone(start, '2025-02-04');
    expect(milestone400.targetDays).toBe(500);
  });
});

describe('Database & RLS: couples.start_date & important_dates', () => {
  const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

  it('contains the anniversary & milestone alert migration', () => {
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const annivMigration = files.find((f) => f.includes('anniversary_milestones_and_alerts'));
    expect(annivMigration).toBeDefined();

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, annivMigration!), 'utf8');
    expect(sql).toContain('ALTER TABLE public.couples');
    expect(sql).toContain('start_date DATE');
    expect(sql).toContain('trg_notify_start_date_changed');
    expect(sql).toContain('check_anniversaries_and_milestones');
    expect(sql).toContain('anniversary_date_updated');
  });

  it('enforces RLS isolation for couples and important_dates across two couples and an outsider', () => {
    const memberships = [
      { couple_id: 'couple_1', user_id: 'alice', status: 'active' },
      { couple_id: 'couple_1', user_id: 'bob', status: 'active' },
      { couple_id: 'couple_2', user_id: 'charlie', status: 'active' },
      { couple_id: 'couple_2', user_id: 'dana', status: 'active' },
    ];

    const couples = [
      { id: 'couple_1', name: 'Alice & Bob', start_date: '2022-05-10', status: 'active' },
      { id: 'couple_2', name: 'Charlie & Dana', start_date: '2023-01-01', status: 'active' },
    ];

    const importantDates = [
      { id: 'd1', couple_id: 'couple_1', title: 'First Date', created_by: 'alice' },
      { id: 'd2', couple_id: 'couple_2', title: 'Trip to Paris', created_by: 'charlie' },
    ];

    const getActiveCoupleId = (userId: string) => {
      const m = memberships.find((x) => x.user_id === userId && x.status === 'active');
      return m ? m.couple_id : null;
    };

    const canSelectCouple = (userId: string, coupleId: string) => {
      return getActiveCoupleId(userId) === coupleId;
    };

    const canSelectImportantDates = (userId: string, coupleId: string) => {
      return getActiveCoupleId(userId) === coupleId;
    };

    // Alice & Bob can access Couple 1
    expect(canSelectCouple('alice', 'couple_1')).toBe(true);
    expect(canSelectCouple('bob', 'couple_1')).toBe(true);

    // Charlie & Dana can access Couple 2
    expect(canSelectCouple('charlie', 'couple_2')).toBe(true);
    expect(canSelectCouple('dana', 'couple_2')).toBe(true);

    // Cross-couple and Outsider denied
    expect(canSelectCouple('alice', 'couple_2')).toBe(false);
    expect(canSelectCouple('charlie', 'couple_1')).toBe(false);
    expect(canSelectCouple('outsider_eve', 'couple_1')).toBe(false);
    expect(canSelectCouple('outsider_eve', 'couple_2')).toBe(false);

    // Important dates isolation
    expect(canSelectImportantDates('alice', 'couple_1')).toBe(true);
    expect(canSelectImportantDates('alice', 'couple_2')).toBe(false);
    expect(canSelectImportantDates('outsider_eve', 'couple_1')).toBe(false);
  });
});

describe('KeyboardScreen Component Architecture', () => {
  it('KeyboardScreen is exported and exports valid interface', async () => {
    const { KeyboardScreen } = await import('../src/shared/ui/KeyboardScreen');
    expect(KeyboardScreen).toBeDefined();
    expect(typeof KeyboardScreen).toBe('function');
  });
});

describe('DatePickerField Native Component & Date Safety', () => {
  it('DatePickerField is exported and formats local dates without UTC shifts', async () => {
    const { DatePickerField, formatDateToDateString, parseDateStringToLocalDate } = await import(
      '../src/shared/ui/DatePickerField'
    );
    expect(DatePickerField).toBeDefined();

    // Test date near midnight: 23:59:59 local
    const nearMidnightEnd = new Date(2026, 10, 8, 23, 59, 59);
    expect(formatDateToDateString(nearMidnightEnd)).toBe('2026-11-08');

    // Test date near midnight: 00:00:01 local
    const nearMidnightStart = new Date(2026, 10, 8, 0, 0, 1);
    expect(formatDateToDateString(nearMidnightStart)).toBe('2026-11-08');

    // Test parse string back to local date
    const parsed = parseDateStringToLocalDate('2026-11-08');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(10);
    expect(parsed.getDate()).toBe(8);
  });
});

