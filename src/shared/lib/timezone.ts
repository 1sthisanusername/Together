/**
 * Time zone helper utilities using standard Intl API.
 */

export interface TimeZoneInfo {
  timeString: string;
  dateString: string;
  isNight: boolean;
  hour: number;
}

/**
 * Returns the device's current IANA time zone.
 */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formats the current time in a specified IANA time zone.
 */
export function getTimeInZone(timeZone: string, date: Date = new Date()): TimeZoneInfo {
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });

    const hour = parseInt(hourFormatter.format(date), 10);
    const isNight = hour < 6 || hour >= 23;

    return {
      timeString: timeFormatter.format(date),
      dateString: dateFormatter.format(date),
      isNight,
      hour,
    };
  } catch {
    // Fallback if timezone string is unrecognized
    return {
      timeString: date.toLocaleTimeString(),
      dateString: date.toLocaleDateString(),
      isNight: false,
      hour: date.getHours(),
    };
  }
}

/**
 * Calculates the hour difference between two IANA time zones.
 * Positive = target is ahead, Negative = target is behind.
 */
export function getTimeDifference(baseZone: string, targetZone: string, date: Date = new Date()): number {
  try {
    const getOffsetMinutes = (tz: string) => {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return (tzDate.getTime() - utcDate.getTime()) / 60000;
    };

    const diffMinutes = getOffsetMinutes(targetZone) - getOffsetMinutes(baseZone);
    return Math.round(diffMinutes / 60);
  } catch {
    return 0;
  }
}

/**
 * Calculates days together given a start date (YYYY-MM-DD).
 */
export function getDaysTogether(startDateStr: string | null | undefined): number | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

