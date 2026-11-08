import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';

const Animated = {
  View: (props: any) => React.createElement(View, props),
  Text: (props: any) => React.createElement(Text, props),
  Image: (props: any) => React.createElement(Image, props),
  ScrollView: (props: any) => React.createElement(ScrollView, props),
  createAnimatedComponent: (comp: any) => comp,
};

export const useSharedValue = (init: any) => ({ value: init });
export const useAnimatedStyle = (fn: any) => fn() || {};
export const withSpring = (toValue: any) => toValue;
export const withTiming = (toValue: any) => toValue;
export const withRepeat = (anim: any) => anim;
export const withSequence = (...anims: any[]) => anims[0];
export const withDelay = (_delay: number, anim: any) => anim;
export const cancelAnimation = () => {};
export const Easing = {
  linear: (t: number) => t,
  bezier: () => (t: number) => t,
  inOut: () => (t: number) => t,
  ease: (t: number) => t,
};

export { Animated };
export default Animated;

