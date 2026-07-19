// Extracted directly from the Stitch Material Design 3 tailwind.config
// found consistently across every exported screen (Home, Login, Planner, etc.)

export const colors = {
  primary: '#0d631b',
  onPrimary: '#ffffff',
  primaryContainer: '#2e7d32',
  onPrimaryContainer: '#cbffc2',
  primaryFixed: '#a3f69c',
  primaryFixedDim: '#88d982',
  onPrimaryFixed: '#002204',
  onPrimaryFixedVariant: '#005312',
  inversePrimary: '#88d982',

  secondary: '#7e5700',
  onSecondary: '#ffffff',
  secondaryContainer: '#feb300',
  onSecondaryContainer: '#6a4800',
  secondaryFixed: '#ffdeac',
  secondaryFixedDim: '#ffba38',
  onSecondaryFixed: '#281900',
  onSecondaryFixedVariant: '#604100',

  tertiary: '#00631e',
  onTertiary: '#ffffff',
  tertiaryContainer: '#277d34',
  onTertiaryContainer: '#c7ffc3',
  tertiaryFixed: '#9ff79f',
  tertiaryFixedDim: '#83da85',
  onTertiaryFixed: '#002105',
  onTertiaryFixedVariant: '#005318',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  background: '#f8faf8',
  onBackground: '#191c1b',

  surface: '#f8faf8',
  onSurface: '#191c1b',
  surfaceVariant: '#e1e3e1',
  onSurfaceVariant: '#40493d',
  surfaceDim: '#d8dad9',
  surfaceBright: '#f8faf8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f2',
  surfaceContainer: '#eceeec',
  surfaceContainerHigh: '#e6e9e7',
  surfaceContainerHighest: '#e1e3e1',
  surfaceTint: '#1b6d24',

  inverseSurface: '#2e3130',
  inverseOnSurface: '#eff1ef',

  outline: '#707a6c',
  outlineVariant: '#bfcaba',
} as const;

export type ColorToken = keyof typeof colors;