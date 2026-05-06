import { Platform } from 'react-native';

export const C = {
  bg: '#f0ece4',
  surface: '#faf7f2',
  surfaceAlt: '#ede8df',
  ink: '#2c1a0e',
  inkMid: '#5c4a3a',
  inkLight: '#8a7a6a',
  stamp: '#b5451b',
  stampSoft: '#f0e0d8',
  stampBg: '#fdf7f4',
  border: '#d4c9b8',
  divider: '#e0d8cc',
  positive: '#3d6b44',
  positiveBg: '#e8f4ea',
  negative: '#9b2226',
  negativeBg: '#fce8e8',
  neutral: '#7a6a58',
  neutralBg: '#e8e4dc',
};

export const F = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};
