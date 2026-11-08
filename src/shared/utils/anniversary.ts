/**
 * Anniversary and "Together Since" calculation utilities.
 * Calculated strictly from calendar date strings (YYYY-MM-DD) so it produces
 * identical, deterministic results across all time zones on both partners' devices.
 */

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface TogetherDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formattedText: string;
}

export interface NextAnniversary {
  nextDate: string; // YYYY-MM-DD
  daysRemaining: number;
  yearsTogetherNext: number;
}

export interface NextMilestone {
  targetDays: number;
  daysRemaining: number;
  description: string;
}

/**
 * Checks if a given year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Parses YYYY-MM-DD string into year, month (1-12), and day (1-31)
 */
export function parseDateString(dateStr: string): DateParts {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

/**
 * Returns today's calendar date in YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the exact number of calendar days between two YYYY-MM-DD dates
 */
export function calculateDaysTogether(startDateStr: string, asOfDateStr?: string): number {
  const start = parseDateString(startDateStr);
  const asOf = parseDateString(asOfDateStr || getTodayString());

  const utcStart = Date.UTC(start.year, start.month - 1, start.day);
  const utcAsOf = Date.UTC(asOf.year, asOf.month - 1, asOf.day);

  if (utcAsOf < utcStart) {
    return 0; // Future start date not allowed
  }

  const diffMs = utcAsOf - utcStart;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates years, months, and days breakdown (e.g. "1 year, 3 months, 12 days")
 */
export function calculateTogetherDuration(
  startDateStr: string,
  asOfDateStr?: string
): TogetherDuration {
  const start = parseDateString(startDateStr);
  const asOf = parseDateString(asOfDateStr || getTodayString());
  const totalDays = calculateDaysTogether(startDateStr, asOfDateStr);

  if (totalDays === 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      formattedText: 'Started today!',
    };
  }

  let years = asOf.year - start.year;
  let months = asOf.month - start.month;
  let days = asOf.day - start.day;

  if (days < 0) {
    // Days in previous month
    const prevMonthDays = new Date(Date.UTC(asOf.year, asOf.month - 1, 0)).getUTCDate();
    days += prevMonthDays;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }

  return {
    years,
    months,
    days,
    totalDays,
    formattedText: `Together for ${parts.join(', ')}`,
  };
}

/**
 * Calculates the next upcoming yearly anniversary
 * Handles leap day (Feb 29) gracefully: falls on Feb 28 in non-leap years.
 */
export function calculateNextAnniversary(
  startDateStr: string,
  asOfDateStr?: string
): NextAnniversary {
  const start = parseDateString(startDateStr);
  const asOf = parseDateString(asOfDateStr || getTodayString());

  let targetYear = asOf.year;

  // Function to get anniversary day in target year
  const getAnnivDay = (yr: number) => {
    if (start.month === 2 && start.day === 29 && !isLeapYear(yr)) {
      return 28;
    }
    return start.day;
  };

  const annivThisYearDay = getAnnivDay(targetYear);
  const utcThisYearAnniv = Date.UTC(targetYear, start.month - 1, annivThisYearDay);
  const utcToday = Date.UTC(asOf.year, asOf.month - 1, asOf.day);

  if (utcThisYearAnniv < utcToday) {
    // Already passed this year -> next year
    targetYear += 1;
  }

  const nextAnnivDay = getAnnivDay(targetYear);
  const utcTarget = Date.UTC(targetYear, start.month - 1, nextAnnivDay);
  const daysRemaining = Math.max(0, Math.floor((utcTarget - utcToday) / (1000 * 60 * 60 * 24)));
  const yearsTogetherNext = targetYear - start.year;

  const mm = String(start.month).padStart(2, '0');
  const dd = String(nextAnnivDay).padStart(2, '0');

  return {
    nextDate: `${targetYear}-${mm}-${dd}`,
    daysRemaining,
    yearsTogetherNext,
  };
}

/**
 * Client-calculated milestones (no new table needed):
 * 100 days, 200, 365, 500, 1000, 1500, 2000, etc.
 */
const MILESTONE_THRESHOLDS = [100, 200, 365, 500, 1000, 1500, 2000, 2500, 3000, 5000, 10000];

export function calculateNextMilestone(
  startDateStr: string,
  asOfDateStr?: string
): NextMilestone {
  const totalDays = calculateDaysTogether(startDateStr, asOfDateStr);

  const nextThreshold =
    MILESTONE_THRESHOLDS.find((threshold) => threshold > totalDays) ||
    Math.ceil((totalDays + 1) / 1000) * 1000;

  const daysRemaining = nextThreshold - totalDays;

  return {
    targetDays: nextThreshold,
    daysRemaining,
    description: `${nextThreshold} Days Together`,
  };
}

