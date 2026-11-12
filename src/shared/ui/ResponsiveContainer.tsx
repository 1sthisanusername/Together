import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useResponsiveLayout } from '@/shared/theme';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Centered responsive content container that prevents cards/forms from stretching
 * edge-to-edge on tablets, foldables, or desktop browsers while remaining full-width on phones.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  wide = false,
  style,
}) => {
  const { contentMaxWidth, wideMaxWidth } = useResponsiveLayout();

  return (
    <View
      style={[
        styles.container,
        { maxWidth: wide ? wideMaxWidth : contentMaxWidth },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});

