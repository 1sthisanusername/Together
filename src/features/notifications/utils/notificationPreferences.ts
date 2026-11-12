import type { UserSetting } from '@/shared/types';

function parseTimeToMinutes(timeStr?: string | null, fallbackMinutes = 0): number {
  if (!timeStr) return fallbackMinutes;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMinutes;
  return h * 60 + m;
}

export function isInQuietHours(
  settings: Partial<UserSetting> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!settings?.quiet_hours_enabled) return false;
  const startMin = parseTimeToMinutes(settings.quiet_hours_start, 22 * 60);
  const endMin = parseTimeToMinutes(settings.quiet_hours_end, 8 * 60);
  if (startMin === endMin) return false;

  const currentMin = now.getHours() * 60 + now.getMinutes();
  return startMin > endMin
    ? currentMin >= startMin || currentMin < endMin
    : currentMin >= startMin && currentMin < endMin;
}

export function shouldShowNotificationBanner(
  notifType: string,
  settings: Partial<UserSetting> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!settings) return true;
  if (settings.notifications_enabled === false) return false;
  if (isInQuietHours(settings, now)) return false;

  const norm = (notifType || '').toLowerCase();
  if ((norm.includes('message') || norm.includes('chat') || norm.includes('voice')) && settings.notify_messages === false) {
    return false;
  }
  if (norm.includes('letter') && settings.notify_letters === false) {
    return false;
  }
  if ((norm.includes('daily_question') || norm.includes('question')) && settings.notify_daily_question === false) {
    return false;
  }
  if ((norm.includes('photo') || norm.includes('memory') || norm.includes('mission')) && settings.notify_photos === false) {
    return false;
  }
  if ((norm.includes('game') || norm.includes('activity') || norm.includes('quiz') || norm.includes('round')) && settings.notify_games === false) {
    return false;
  }
  if (norm.includes('date') && settings.notify_dates === false) {
    return false;
  }

  return true;
}
