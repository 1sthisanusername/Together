import React from 'react';

export const KeyboardProvider = ({ children }: any) => children;
export const KeyboardAwareScrollView = React.forwardRef(({ children, ...props }: any, ref) =>
  React.createElement('ScrollView', { ref, ...props }, children)
);
export const KeyboardStickyView = ({ children }: any) => children;
export const KeyboardAvoidingView = ({ children }: any) => children;
export const useKeyboardHandler = () => {};
export const useReanimatedFocusedInput = () => {};
export const KeyboardController = {
  setInputMode: () => {},
  setDefaultMode: () => {},
};

