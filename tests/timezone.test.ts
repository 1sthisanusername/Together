import { describe, it, expect } from 'vitest';
import {
  getDeviceTimeZone,
  getTimeInZone,
  getTimeDifference,
  getDaysTogether,
} from '../src/shared/lib/timezone';
import { getUtcOffsetString } from '../src/features/settings/components/TimeZonePickerModal';

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

  it('calculates correct UTC offset strings for IANA time zones', () => {
    const testDate = new Date('2026-11-07T12:00:00Z');
    
    expect(getUtcOffsetString('Asia/Kolkata', testDate)).toBe('UTC+05:30');
    expect(getUtcOffsetString('Europe/London', testDate)).toBe('UTC+00:00');
    expect(getUtcOffsetString('UTC', testDate)).toBe('UTC+00:00');
    expect(getUtcOffsetString('America/New_York', testDate)).toBe('UTC-05:00');
  });

  it('updates partner local time on Home when partner timezone changes in profile', () => {
    const testDate = new Date('2026-11-07T12:00:00Z'); // 12:00 PM UTC
    const userZone = 'Asia/Kolkata'; // 17:30 (5:30 PM)
    
    // Partner originally in London (12:00 PM)
    let partnerZone = 'Europe/London';
    let partnerTime = getTimeInZone(partnerZone, testDate);
    let diff = getTimeDifference(userZone, partnerZone, testDate);
    expect(partnerTime.timeString).toMatch(/12:00/);
    expect(diff).toBe(-5); // London is 5.5 hours behind Kolkata (Math.round(-5.5) = -5)

    // Partner changes profile timezone to Tokyo (21:00 / 9:00 PM)
    partnerZone = 'Asia/Tokyo';
    partnerTime = getTimeInZone(partnerZone, testDate);
    diff = getTimeDifference(userZone, partnerZone, testDate);
    expect(partnerTime.timeString).toMatch(/9:00/);
    expect(diff).toBe(4); // Tokyo is 3.5 hours ahead of Kolkata (Math.round(3.5) = 4)
  });
});

