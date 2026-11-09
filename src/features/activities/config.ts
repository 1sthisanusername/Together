/**
 * Activities Feature Flags & Configuration
 *
 * Simultaneous real-time activities (e.g. live canvas drawing) require dedicated
 * bidirectional low-latency presence signaling. When disabled, these activities are
 * gracefully hidden from the catalogue to avoid presenting broken or unplayable games.
 */
export const ENABLE_SIMULTANEOUS_ACTIVITIES = false;
