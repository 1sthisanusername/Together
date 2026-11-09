import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TabIconProps {
  color: any;
  size?: number;
}

/**
 * String & Stickers Tab Icons:
 * Chunky 2px ink doodle vector icons.
 */

// Home: Playful cartoon house with chimney
export const HomeIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    {/* Chimney */}
    <View style={[styles.chimney, { borderColor: color }]} />
    {/* Roof */}
    <View style={[styles.roof, { borderColor: color, width: size * 0.8, height: size * 0.4 }]} />
    {/* House Body */}
    <View style={[styles.houseBody, { borderColor: color, width: size * 0.65, height: size * 0.44 }]}>
      {/* Door */}
      <View style={[styles.door, { borderColor: color }]} />
    </View>
  </View>
);

// Play: Playful game controller doodle with chunky buttons
export const PlayIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.controllerBody, { borderColor: color, width: size * 0.88, height: size * 0.52 }]}>
      {/* D-Pad cross */}
      <View style={[styles.dpad, { backgroundColor: color }]} />
      {/* Action button dots */}
      <View style={styles.actionButtonsCol}>
        <View style={[styles.actionDot, { backgroundColor: color }]} />
        <View style={[styles.actionDot, { backgroundColor: color }]} />
      </View>
    </View>
  </View>
);

// Dates: Cartoon calendar sheet with chunky ring binder holes
export const DatesIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    {/* Binder tabs */}
    <View style={styles.binderRow}>
      <View style={[styles.binderRing, { backgroundColor: color }]} />
      <View style={[styles.binderRing, { backgroundColor: color }]} />
    </View>
    <View style={[styles.calendarSheet, { borderColor: color, width: size * 0.76, height: size * 0.72 }]}>
      <View style={[styles.calendarHeaderLine, { backgroundColor: color }]} />
      <View style={[styles.calendarHeart, { backgroundColor: color }]} />
    </View>
  </View>
);

// Memories: Polaroid frame with miniature photo center
export const MemoriesIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.polaroidFrame, { borderColor: color, width: size * 0.74, height: size * 0.84 }]}>
      <View style={[styles.polaroidPhoto, { borderColor: color }]} />
    </View>
  </View>
);

// Us: Two loving faces / circles linked by a little string
export const UsIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <View style={[styles.personHead, { borderColor: color, left: 1, top: 2 }]} />
    <View style={[styles.personHead, { borderColor: color, right: 1, top: 2 }]} />
    {/* Connecting curved string between them */}
    <View style={[styles.connectingString, { borderColor: color }]} />
  </View>
);

// Camera: Playful chunky camera with lens circle and flash bump
export const CameraIcon: React.FC<TabIconProps> = ({ color, size = 24 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    {/* Top flash bump */}
    <View style={[styles.cameraFlashBump, { backgroundColor: color }]} />
    {/* Camera Body */}
    <View style={[styles.cameraBody, { borderColor: color, width: size * 0.88, height: size * 0.65 }]}>
      {/* Lens Circle */}
      <View style={[styles.cameraLens, { borderColor: color, width: size * 0.38, height: size * 0.38 }]}>
        <View style={[styles.cameraLensDot, { backgroundColor: color }]} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Home
  roof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 2,
  },
  chimney: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 3.5,
    height: 6,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
  },
  houseBody: {
    borderWidth: 2,
    borderTopWidth: 0,
    position: 'absolute',
    bottom: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  door: {
    width: 6,
    height: 7,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Play
  controllerBody: {
    borderWidth: 2,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3.5,
  },
  dpad: {
    width: 5,
    height: 5,
    borderRadius: 1,
  },
  actionButtonsCol: {
    flexDirection: 'row',
    gap: 2.5,
  },
  actionDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },

  // Dates
  binderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    zIndex: 2,
    marginBottom: -2,
  },
  binderRing: {
    width: 2.5,
    height: 4,
    borderRadius: 1,
  },
  calendarSheet: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
  },
  calendarHeaderLine: {
    width: '100%',
    height: 3,
    marginBottom: 2.5,
  },
  calendarHeart: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Memories
  polaroidFrame: {
    borderWidth: 2,
    borderRadius: 3,
    padding: 2,
    alignItems: 'center',
  },
  polaroidPhoto: {
    width: '100%',
    height: '65%',
    borderWidth: 1.5,
    borderRadius: 1,
  },

  // Us
  personHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    position: 'absolute',
  },
  connectingString: {
    width: 14,
    height: 8,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    position: 'absolute',
    bottom: 3,
  },

  // Camera
  cameraFlashBump: {
    width: 6,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: -1,
  },
  cameraBody: {
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLens: {
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLensDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
