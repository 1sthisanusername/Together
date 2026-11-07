export type AnalyticsEvent =
  | 'account_created'
  | 'partner_linked'
  | 'activity_started'
  | 'activity_completed'
  | 'game_replayed'
  | 'challenge_completed'
  | 'letter_opened'
  | 'date_completed'
  | 'memory_created'
  | 'couple_returned';

export interface AnalyticsService {
  track: (event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) => void;
  identify: (userId: string, traits?: Record<string, string | number | boolean | null>) => void;
  reset: () => void;
}

// PostHog / privacy-first analytics provider wrapper
class AppAnalytics implements AnalyticsService {
  track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>): void {
    // In MVP / local dev: structured logging, ready for PostHog client injection
    if (__DEV__) {
      console.log(`[Analytics] Track: ${event}`, properties ?? {});
    }
  }

  identify(userId: string, traits?: Record<string, string | number | boolean | null>): void {
    if (__DEV__) {
      console.log(`[Analytics] Identify: ${userId}`, traits ?? {});
    }
  }

  reset(): void {
    if (__DEV__) {
      console.log('[Analytics] Reset');
    }
  }
}

export const analytics = new AppAnalytics();

