import React from 'react';

export const Svg = ({ children, ...props }: any) => React.createElement('svg', props, children);
export const Path = (props: any) => React.createElement('path', props);
export const Line = (props: any) => React.createElement('line', props);
export const Circle = (props: any) => React.createElement('circle', props);
export const Rect = (props: any) => React.createElement('rect', props);
export const G = ({ children, ...props }: any) => React.createElement('g', props, children);
export const Text = ({ children, ...props }: any) => React.createElement('text', props, children);

export default Svg;

