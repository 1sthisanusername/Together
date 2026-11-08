import React from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { theme } from '@/shared/theme';

export interface KeyboardScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Bottom bar or input that must sit directly above keyboard (e.g. Chat/Messages)
   */
  fixedBottom?: React.ReactNode;
  /**
   * Extra scroll offset to keep focused inputs and submit buttons reachable
   */
  bottomOffset?: number;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  scrollEnabled?: boolean;
}

/**
 * Shared KeyboardScreen Component:
 * Wraps form and input content with keyboard-aware scrolling, auto-focus scrolling,
 * safe-area insets padding, and tap-outside / scroll dismissal.
 */
export const KeyboardScreen: React.FC<KeyboardScreenProps> = ({
  children,
  style,
  contentContainerStyle,
  fixedBottom,
  bottomOffset,
  keyboardShouldPersistTaps = 'handled',
  scrollEnabled = true,
}) => {
  const insets = useSafeAreaInsets();
  const calculatedBottomOffset = bottomOffset ?? Math.max(insets.bottom, 16) + 16;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      <View style={styles.flex}>
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: fixedBottom ? 8 : insets.bottom + 20 },
            contentContainerStyle,
          ]}
          bottomOffset={calculatedBottomOffset}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScrollView>

        {fixedBottom && (
          <KeyboardStickyView offset={{ closed: insets.bottom, opened: 0 }}>
            <View style={[styles.fixedBottomContainer, { paddingBottom: insets.bottom }]}>
              {fixedBottom}
            </View>
          </KeyboardStickyView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  fixedBottomContainer: {
    backgroundColor: theme.colors.surface,
  },
});

