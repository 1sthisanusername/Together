// Minimal mock for react-native in Node test runner
export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const StyleSheet = {
  create: (styles: any) => styles,
};
export const ScrollView = 'ScrollView';
export const PanResponder = {
  create: () => ({ panHandlers: {} }),
};
export const Platform = {
  OS: 'ios',
  select: (objs: any) => objs.ios || objs.default,
};
export const ActivityIndicator = 'ActivityIndicator';
export const Image = 'Image';
export const TextInput = 'TextInput';
export const Modal = 'Modal';
export const TouchableWithoutFeedback = 'TouchableWithoutFeedback';
export const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
};
export const Animated = {
  Value: class {
    constructor(public val: any) {}
    setValue(v: any) { this.val = v; }
  },
  timing: () => ({ start: (cb?: any) => cb?.(), stop: () => {} }),
  parallel: (arr: any) => ({ start: (cb?: any) => cb?.(), stop: () => {} }),
  sequence: (arr: any) => ({ start: (cb?: any) => cb?.(), stop: () => {} }),
  loop: (anim: any) => ({ start: () => {}, stop: () => {} }),
  View: 'Animated.View',
};
export const NativeModules = {
  BlobModule: null,
};
export const TurboModuleRegistry = {
  get: (name: string) => ({ name }),
  getEnforcing: (name: string) => ({ name }),
};
export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => {} }),
};
export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
};
export const Easing = {
  bezier: () => (t: number) => t,
  linear: (t: number) => t,
};
export default {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  NativeModules,
  TurboModuleRegistry,
  Dimensions,
  PixelRatio,
  Easing,
};
