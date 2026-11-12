import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Avatar } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

export interface PartnerStringProps {
  myName: string;
  myAvatarUrl?: string | null;
  partnerName: string;
  partnerAvatarUrl?: string | null;
  isPartnerOnline?: boolean;
  isMyOnline?: boolean;
}

export const PartnerString: React.FC<PartnerStringProps> = ({
  myName,
  myAvatarUrl,
  partnerName,
  partnerAvatarUrl,
  isPartnerOnline = false,
  isMyOnline = true,
}) => {
  // Wiggle animation for tight string when online
  const wiggleY = useSharedValue(0);
  const wiggleRotate = useSharedValue(0);

  useEffect(() => {
    if (isPartnerOnline) {
      // Rapid, tight telephone string vibration wave
      wiggleY.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 80, easing: Easing.linear }),
          withTiming(2.5, { duration: 80, easing: Easing.linear }),
          withTiming(-1.5, { duration: 80, easing: Easing.linear }),
          withTiming(1.5, { duration: 80, easing: Easing.linear }),
          withTiming(0, { duration: 60, easing: Easing.linear })
        ),
        -1,
        true
      );
      wiggleRotate.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(wiggleY);
      cancelAnimation(wiggleRotate);
      wiggleY.value = 0;
      wiggleRotate.value = 0;
    }

    return () => {
      cancelAnimation(wiggleY);
      cancelAnimation(wiggleRotate);
    };
  }, [isPartnerOnline, wiggleY, wiggleRotate]);

  const animatedWiggleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: wiggleY.value },
        { rotate: `${wiggleRotate.value}deg` },
      ],
    };
  });

  const stringWidth = scale(130);
  const stringHeight = scale(65);

  return (
    <View style={styles.container}>
      {/* 1. Avatars & String Row */}
      <View style={styles.row}>
        {/* User (Me) */}
        <View style={styles.avatarCol}>
          <Avatar
            name={myName || 'You'}
            url={myAvatarUrl}
            size={56}
            showPresence
            isOnline={isMyOnline}
            stickerColor="pool"
          />
          <Text style={styles.nameLabel} numberOfLines={1}>
            {myName || 'You'}
          </Text>
        </View>

        {/* The Connecting Partner String */}
        <View style={[styles.stringCanvasWrapper, { width: stringWidth, height: stringHeight }]}>
          {isPartnerOnline ? (
            /* TIGHT STRING (WITH REANIMATED WIGGLE) */
            <Animated.View style={[styles.stringContainer, animatedWiggleStyle]}>
              <Svg width={stringWidth} height={stringHeight} viewBox={`0 0 ${stringWidth} ${stringHeight}`}>
                {/* Taut pulled Amour Red string */}
                <Path
                  d={`M 6,${stringHeight / 2} L ${stringWidth - 6},${stringHeight / 2}`}
                  stroke={theme.colors.primary}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {/* Tie knot on left */}
                <Circle cx={6} cy={stringHeight / 2} r={3.5} fill={theme.colors.primary} />
                {/* Tie knot on right */}
                <Circle cx={stringWidth - 6} cy={stringHeight / 2} r={3.5} fill={theme.colors.primary} />
              </Svg>

              {/* Connected Vibrating Pill Tag */}
              <View style={styles.connectedTag}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>connected! ⚡</Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            /* SLACK STRING (RELAXED HANGING LOOP) */
            <View style={styles.stringContainer}>
              <Svg width={stringWidth} height={stringHeight} viewBox={`0 0 ${stringWidth} ${stringHeight}`}>
                {/* Sagging catenary curve */}
                <Path
                  d={`M 6,${scale(20)} Q ${stringWidth / 2},${stringHeight - scale(6)} ${stringWidth - 6},${scale(20)}`}
                  stroke={theme.colors.rose}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="5,3"
                />
                {/* Tie knot on left */}
                <Circle cx={6} cy={scale(20)} r={3.5} fill={theme.colors.rose} />
                {/* Tie knot on right */}
                <Circle cx={stringWidth - 6} cy={scale(20)} r={3.5} fill={theme.colors.rose} />
              </Svg>

              {/* Resting Pill Tag */}
              <View style={styles.slackTag}>
                <View style={styles.slackBadge}>
                  <Text style={styles.slackText}>away 💤</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Partner */}
        <View style={styles.avatarCol}>
          <Avatar
            name={partnerName || 'Partner'}
            url={partnerAvatarUrl}
            size={56}
            showPresence
            isOnline={isPartnerOnline}
            stickerColor="sunshine"
          />
          <Text style={styles.nameLabel} numberOfLines={1}>
            {partnerName || 'Partner'}
          </Text>
        </View>
      </View>

      {/* 2. Automatic Online Status Indicator Pill */}
      <View style={styles.statusTogglePill}>
        <View
          style={[
            styles.statusPillSurface,
            isPartnerOnline ? styles.pillOnline : styles.pillOffline,
          ]}
        >
          <View
            style={[
              styles.statusDotCircle,
              { backgroundColor: isPartnerOnline ? theme.colors.success : theme.colors.textMuted },
            ]}
          />
          <Text style={styles.statusPillText}>
            {isPartnerOnline
              ? `${partnerName} is Online • String is tight ⚡`
              : `${partnerName} is Away • String is slack 💤`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: scale(10),
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  avatarCol: {
    alignItems: 'center',
    width: scale(72),
  },
  nameLabel: {
    marginTop: scale(6),
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
    textAlign: 'center',
  },
  stringCanvasWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(2),
  },
  stringContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  connectedTag: {
    position: 'absolute',
    alignSelf: 'center',
    top: scale(6),
  },
  connectedBadge: {
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    ...theme.shadows.hardSm,
  },
  connectedText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.primary,
  },
  slackTag: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: scale(10),
  },
  slackBadge: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    ...theme.shadows.hardSm,
  },
  slackText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
  },
  statusTogglePill: {
    marginTop: scale(4),
  },
  statusPillSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    gap: scale(8),
    ...theme.shadows.hardSm,
  },
  pillOnline: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  pillOffline: {
    backgroundColor: theme.colors.surface,
  },
  statusDotCircle: {
    width: scale(8),
    height: scale(8),
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.text,
  },
});
