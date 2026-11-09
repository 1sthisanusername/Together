/**
 * Centralized Notification Router
 * Coordinates navigation targets from cold-start push notifications,
 * background notifications, and in-app notification taps to ensure
 * reliable, duplicate-free redirection after auth & couple state are resolved.
 */

let pendingRoute: string | null = null;
let dispatcher: ((route: string) => void) | null = null;
let isReadyToNavigate = false;

export const notificationRouter = {
  /**
   * Sets a pending route target from a push notification or in-app tap
   */
  setPendingRoute(rawRoute: string) {
    if (!rawRoute) return;
    const cleanRoute = rawRoute.replace(/^together:\/\//, '/');
    
    if (isReadyToNavigate && dispatcher) {
      dispatcher(cleanRoute);
    } else {
      pendingRoute = cleanRoute;
    }
  },

  /**
   * Returns any queued pending route (or null)
   */
  getPendingRoute(): string | null {
    return pendingRoute;
  },

  /**
   * Clears the pending route after successful consumption
   */
  clearPendingRoute() {
    pendingRoute = null;
  },

  /**
   * Marks the router ready to navigate once the active couple state is verified
   */
  markReady(ready: boolean) {
    isReadyToNavigate = ready;
    if (ready && pendingRoute && dispatcher) {
      const target = pendingRoute;
      pendingRoute = null;
      dispatcher(target);
    }
  },

  /**
   * Registers the Expo Router navigation dispatcher
   */
  registerDispatcher(fn: (route: string) => void) {
    dispatcher = fn;
    if (isReadyToNavigate && pendingRoute) {
      const target = pendingRoute;
      pendingRoute = null;
      fn(target);
    }
  },

  /**
   * Unregisters dispatcher on unmount
   */
  unregisterDispatcher() {
    dispatcher = null;
    isReadyToNavigate = false;
  },
};

