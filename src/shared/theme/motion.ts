import * as Haptics from 'expo-haptics';

/**
 * Shared motion tokens: STRING & STICKERS
 * Playful spring physics with tactile sink-into-shadow button mechanics
 */
export const motion = {
  // Snappy, playful toybox spring
  spring: {
    damping: 18,
    stiffness: 300,
    mass: 0.7,
  },
  // Bouncier spring for stickers and reveals
  bouncy: {
    damping: 12,
    stiffness: 220,
    mass: 0.9,
  },
  // Gentle wiggle spring for the taut partner string
  wiggle: {
    damping: 8,
    stiffness: 160,
  },
  // Hard offset displacement when sinking into shadow
  pressOffset: 3,
} as const;

export type HapticType = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const triggerHaptic = async (type: HapticType = 'light'): Promise<void> => {
  try {
    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Graceful no-op in simulator, web, or headless test runners
  }
};
