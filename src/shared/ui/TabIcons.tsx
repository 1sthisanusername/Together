import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface TabIconProps {
  color: any;
  size?: number;
  focused?: boolean;
  strokeWidth?: number;
}

const getTintFill = (color: any, focused = false): string => {
  if (!focused) return 'none';
  if (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    return `${color}22`;
  }
  return 'rgba(229, 57, 53, 0.14)';
};

/**
 * Love, Joy & Connection Bespoke Vector Icon Set (react-native-svg):
 * Warm, rounded 2px ink-line icons with soft translucent fills on active states.
 */

// 1. Home: Cozy cottage with arched doorway & chimney
export const HomeIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 10.5L12 4L20 10.5V19C20 19.8284 19.3284 20.5 18.5 20.5H5.5C4.67157 20.5 4 19.8284 4 19V10.5Z"
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 20.5V14.5C9.5 13.3954 10.3954 12.5 11.5 12.5H12.5C13.6046 12.5 14.5 13.3954 14.5 14.5V20.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.5 6.5V4.5H18.5V8.2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 2. Play: Rounded game controller with D-pad & action dots
export const PlayIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={2.5}
      y={6.5}
      width={19}
      height={11.5}
      rx={5.75}
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M7.5 10.2V14.2M5.5 12.2H9.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx={15.2} cy={11} r={1.1} fill={color} />
    <Circle cx={17.6} cy={13.2} r={1.1} fill={color} />
  </Svg>
);

// 3. Camera: Retro polaroid camera with centered lens & viewfinder dot
export const CameraIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 7.5H7.2L8.8 5H15.2L16.8 7.5H19.5C20.6046 7.5 21.5 8.39543 21.5 9.5V17.5C21.5 18.6046 20.6046 19.5 19.5 19.5H4.5C3.39543 19.5 2.5 18.6046 2.5 17.5V9.5C2.5 8.39543 3.39543 7.5 4.5 7.5Z"
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={13.3} r={3.4} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={17.5} cy={10.2} r={0.9} fill={color} />
  </Svg>
);

// 4. Memories: Polaroid frame with horizon landscape & sun dot
export const MemoriesIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={4}
      y={3.5}
      width={16}
      height={17}
      rx={3}
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Rect
      x={6.8}
      y={6.2}
      width={10.4}
      height={9}
      rx={1.5}
      stroke={color}
      strokeWidth={strokeWidth - 0.3}
      strokeLinejoin="round"
    />
    <Path
      d="M7.2 14L10 11.4L12.3 13.4L14.5 11.8L16.8 14.2"
      stroke={color}
      strokeWidth={strokeWidth - 0.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={14.3} cy={8.7} r={1} fill={color} />
  </Svg>
);

// 5. Us: Two intertwined couple hearts
export const UsIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.5 18.2C9.5 18.2 3.5 14.4 3.5 9.6C3.5 7.4 5.2 5.8 7.2 5.8C8.6 5.8 9.7 6.5 10.3 7.6C10.9 6.5 12 5.8 13.4 5.8C15.4 5.8 17.1 7.4 17.1 9.6C17.1 14.4 11.1 18.2 11.1 18.2H9.5Z"
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.2 19C17.6 17.3 20.5 14.6 20.5 11.2C20.5 9.3 19.1 8 17.4 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 6. Dates: Calendar sheet with top binder loops and center marker
export const DatesIcon: React.FC<TabIconProps> = ({
  color,
  size = 24,
  focused = false,
  strokeWidth = 2.1,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={5.5}
      width={17}
      height={15}
      rx={3}
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M8 3.5V6.5M16 3.5V6.5M3.5 9.8H20.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={14.8} r={2} fill={color} />
  </Svg>
);

// 7. Bell: Notifications bell
export const BellIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 10C6.5 6.96243 8.96243 4.5 12 4.5C15.0376 4.5 17.5 6.96243 17.5 10V14.2L19.2 16.5C19.5 16.9 19.2 17.5 18.7 17.5H5.3C4.8 17.5 4.5 16.9 4.8 16.5L6.5 14.2V10Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10 19.5C10.4 20.4 11.1 21 12 21C12.9 21 13.6 20.4 14 19.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

// 8. Chat: Rounded couple chat bubble with message dots
export const ChatIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 6.5C4.5 5.39543 5.39543 4.5 6.5 4.5H17.5C18.6046 4.5 19.5 5.39543 19.5 6.5V14.5C19.5 15.6046 18.6046 16.5 17.5 16.5H9.2L5.2 19.8C4.8 20.1 4.5 19.8 4.5 19.3V6.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={9.2} cy={10.5} r={1} fill={color} />
    <Circle cx={12} cy={10.5} r={1} fill={color} />
    <Circle cx={14.8} cy={10.5} r={1} fill={color} />
  </Svg>
);

// 9. Gear: Clean settings cog
export const GearIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 3.2V5.3M12 18.7V20.8M3.2 12H5.3M18.7 12H20.8M5.8 5.8L7.3 7.3M16.7 16.7L18.2 18.2M18.2 5.8L16.7 7.3M7.3 16.7L5.8 18.2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={12} r={6.6} stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// 10. Gallery: Photo landscape frame
export const GalleryIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={4.5}
      width={17}
      height={15}
      rx={3}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M5 17L9.5 12.2L13 15.5L15.8 12.8L19 16.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={9} cy={9.2} r={1.3} fill={color} />
  </Svg>
);

// 11. Plus: Rounded plus icon
export const PlusIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

// 12. Heart: Clean warm heart
export const HeartIcon: React.FC<TabIconProps & { filled?: boolean }> = ({
  color,
  size = 18,
  filled = true,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20.2C12 20.2 4 15.2 4 9.6C4 6.9 6.1 4.8 8.7 4.8C10.2 4.8 11.4 5.5 12 6.6C12.6 5.5 13.8 4.8 15.3 4.8C17.9 4.8 20 6.9 20 9.6C20 15.2 12 20.2 12 20.2Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 13. Clock: Analog time badge icon
export const ClockIcon: React.FC<TabIconProps> = ({
  color,
  size = 16,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 7.5V12.2L15.2 14"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 14. Plane: Paper plane for Next Reunion
export const PlaneIcon: React.FC<TabIconProps> = ({
  color,
  size = 16,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 3.5L10.5 14M21 3.5L14.5 20.5L10.5 14L3.5 10L21 3.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 15. Sparkles: Four-point sparkle stars
export const SparklesIcon: React.FC<TabIconProps> = ({
  color,
  size = 18,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L13.9 9.1L20 11L13.9 12.9L12 19L10.1 12.9L4 11L10.1 9.1L12 3Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 16.5V19.5M17 18H20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

// 16. Letter: Sealed envelope
export const LetterIcon: React.FC<TabIconProps> = ({
  color,
  size = 18,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3.5}
      y={5.5}
      width={17}
      height={13}
      rx={2.5}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M4.5 7L12 13L19.5 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 17. Sun & Moon for Time Zone status stickers
export const SunIcon: React.FC<TabIconProps> = ({
  color,
  size = 14,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={4} fill={getTintFill(color, true)} stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const MoonIcon: React.FC<TabIconProps> = ({
  color,
  size = 14,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 14.5C18.2 15.1 16.7 15.4 15.1 15.1C11.1 14.4 8.5 10.6 9.2 6.6C9.4 5.4 9.9 4.4 10.6 3.5C6.8 4.1 3.8 7.4 3.8 11.4C3.8 15.8 7.4 19.5 11.9 19.5C15.3 19.5 18.3 17.4 19.5 14.5Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 18. Pin: Location pin
export const PinIcon: React.FC<TabIconProps> = ({
  color,
  size = 14,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C12 21 18 15.2 18 10.2C18 6.8 15.3 4 12 4C8.7 4 6 6.8 6 10.2C6 15.2 12 21 12 21Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10.2} r={2} fill={color} />
  </Svg>
);

// 19. ChevronLeft: Back navigation arrow
export const ChevronLeftIcon: React.FC<TabIconProps> = ({
  color,
  size = 22,
  strokeWidth = 2.2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 6L9 12L15 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 20. Lock: Private Vault / Security padlock
export const LockIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  focused = false,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={5}
      y={10.5}
      width={14}
      height={10}
      rx={3}
      fill={getTintFill(color, focused)}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Path
      d="M8.5 10.5V7.5C8.5 5.567 10.067 4 12 4C13.933 4 15.5 5.567 15.5 7.5V10.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={15.5} r={1.25} fill={color} />
  </Svg>
);

// 21. Flash: Live mode bolt
export const FlashIcon: React.FC<TabIconProps> = ({
  color,
  size = 14,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 3L5.5 13H12L11 21L18.5 11H12L13 3Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// 22. Activity Category Icons
export const ScaleIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4V20M8 20H16M5 8H19M5 8L3.5 13C3.5 14.3 4.8 15.2 6.5 15.2C8.2 15.2 9.5 14.3 9.5 13L8 8M19 8L16 13C16 14.3 17.3 15.2 19 15.2C20.7 15.2 22 14.3 22 13L20.5 8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TargetIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={12} cy={12} r={4.5} stroke={color} strokeWidth={strokeWidth} />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
  </Svg>
);

export const PaletteIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3.5C7.3 3.5 3.5 7.3 3.5 12C3.5 16.4 7 20 11.4 20C12.7 20 13.6 19 13.6 17.8C13.6 17.2 13.4 16.7 13.1 16.2C12.8 15.8 13.1 15.1 13.7 15.1H15.5C18.3 15.1 20.5 12.9 20.5 10.1C20.5 6.4 16.7 3.5 12 3.5Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle cx={8.2} cy={10} r={1.1} fill={color} />
    <Circle cx={11.5} cy={7.8} r={1.1} fill={color} />
    <Circle cx={15.2} cy={9.5} r={1.1} fill={color} />
  </Svg>
);

export const ThoughtIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5C7.5 4.5 4 7.6 4 11.4C4 13.5 5.1 15.4 6.9 16.6L6 19.5L9.4 18C10.2 18.2 11.1 18.3 12 18.3C16.5 18.3 20 15.2 20 11.4C20 7.6 16.5 4.5 12 4.5Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle cx={9} cy={11.5} r={1} fill={color} />
    <Circle cx={12} cy={11.5} r={1} fill={color} />
    <Circle cx={15} cy={11.5} r={1} fill={color} />
  </Svg>
);

export const WineGlassIcon: React.FC<TabIconProps> = ({
  color,
  size = 20,
  strokeWidth = 2,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 4H17L16.2 9.5C15.9 11.9 14.1 13.5 12 13.5C9.9 13.5 8.1 11.9 7.8 9.5L7 4Z"
      fill={getTintFill(color, true)}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path d="M12 13.5V20M8.5 20H15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);
