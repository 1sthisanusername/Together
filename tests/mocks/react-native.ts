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
export const NativeModules = {
  BlobModule: null,
};
