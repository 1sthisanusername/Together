/**
 * Activities Feature Flags & Configuration
 *
 * Simultaneous real-time activities (e.g. live canvas drawing, guided date steps) require
 * dedicated bidirectional low-latency presence signaling and both partners online together.
 * When disabled (ENABLE_SIMULTANEOUS_ACTIVITIES = false), these activities are gracefully
 * filtered everywhere across the app.
 */
export const ENABLE_SIMULTANEOUS_ACTIVITIES = false;

/**
 * Filter predicate to check if an activity is supported in the current environment.
 * Hides guided_date, drawing_guess, or any activity configured for simultaneous/live mode.
 */
export function isActivityAvailable(activity: { kind: string; mode?: string }): boolean {
  if (ENABLE_SIMULTANEOUS_ACTIVITIES) return true;
  if (activity.kind === 'drawing_guess' || activity.kind === 'guided_date') {
    return false;
  }
  if (activity.mode === 'live') {
    return false;
  }
  return true;
}


