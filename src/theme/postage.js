import { Platform } from 'react-native';

export const C = {
  // Paper palette (Voyage · Direction A)
  bg:         '#f3ecdb',
  surface:    '#faf7f0',
  surfaceAlt: '#ede8df',
  ticketStub: '#faf3df',

  // Ink
  ink:      '#1f1812',
  inkMid:   '#5c4a3a',
  inkLight: '#8a7a6a',

  // Accent — stamp red
  stamp:    '#a8341d',
  stampSoft:'#f0e0d8',
  stampBg:  '#fdf7f4',

  // Secondary accents
  blue:  '#1f4b6e',
  ochre: '#a37b27',

  // Structural
  border:  '#d4c9b8',
  divider: '#e0d8cc',

  // Semantic
  positive:    '#3a6b5c',
  positiveBg:  '#e8f4ea',
  negative:    '#9b2226',
  negativeBg:  '#fce8e8',
  neutral:     '#7a6a58',
  neutralBg:   '#e8e4dc',
};

export const F = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  mono:  Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

// Category metadata — glyphs + tints from Voyage Direction A
export const CATS = {
  FOOD:          { label: 'Eat',    glyph: '✦', tint: '#c4623a' },
  TRANSPORT:     { label: 'Move',   glyph: '→', tint: '#3f6d8a' },
  ACCOMMODATION: { label: 'Stay',   glyph: '◐', tint: '#d8a86a' },
  ACTIVITIES:    { label: 'Do',     glyph: '◇', tint: '#7a4d8c' },
  SHOPPING:      { label: 'Shop',   glyph: '✕', tint: '#8a6a3a' },
  HEALTH:        { label: 'Health', glyph: '+', tint: '#c0392b' },
  OTHER:         { label: 'Other',  glyph: '·', tint: '#a09080' },
};
