import { describe, it, expect } from 'vitest';
import {
  getDeviceTimeZone,
  getTimeInZone,
  getTimeDifference,
  getDaysTogether,
} from '../src/shared/lib/timezone';

describe('Timezone & Date Utilities', () => {
  it('returns valid device timezone string', () => {
    const tz = getDeviceTimeZone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('formats time in target zone correctly', () => {
    const testDate = new Date('2026-11-07T12:00:00Z');
    const tokyoTime = getTimeInZone('Asia/Tokyo', testDate);
    // UTC 12:00 -> Tokyo (UTC+9) 21:00 (9:00 PM)
    expect(tokyoTime.timeString).toMatch(/9:00/);
    expect(tokyoTime.hour).toBe(21);
    expect(tokyoTime.isNight).toBe(false);

    // Test night detection for 3 AM
    const nightDate = new Date('2026-11-07T18:00:00Z');
    const tokyoNight = getTimeInZone('Asia/Tokyo', nightDate);
    // UTC 18:00 -> Tokyo 03:00 (3:00 AM)
    expect(tokyoNight.hour).toBe(3);
    expect(tokyoNight.isNight).toBe(true);
  });

  it('calculates hour difference between two timezones', () => {
    const testDate = new Date('2026-11-07T12:00:00Z');
    const diff = getTimeDifference('UTC', 'Asia/Tokyo', testDate);
    expect(diff).toBe(9);

    const diffReverse = getTimeDifference('Asia/Tokyo', 'UTC', testDate);
    expect(diffReverse).toBe(-9);
  });

  it('calculates days together accurately', () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split('T')[0];

    const days = getDaysTogether(dateStr);
    expect(days).toBe(7);

    expect(getDaysTogether(null)).toBeNull();
    expect(getDaysTogether('invalid-date')).toBeNull();
  });
});

