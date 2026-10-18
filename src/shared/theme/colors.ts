export const colors = {
  primary: '#78BE20',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EAF6D7',
  onPrimaryContainer: '#4F7F16',
  primaryFixed: '#D8EFB6',
  primaryFixedDim: '#B7D889',
  onPrimaryFixed: '#20251D',
  onPrimaryFixedVariant: '#4F7F16',
  inversePrimary: '#B7D889',

  secondary: '#D99A28',
  onSecondary: '#20251D',
  secondaryContainer: '#F8E6BD',
  onSecondaryContainer: '#6B4A0F',
  secondaryFixed: '#F6DDA7',
  secondaryFixedDim: '#E9BF63',
  onSecondaryFixed: '#20251D',
  onSecondaryFixedVariant: '#6B4A0F',

  tertiary: '#5C9E2F',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#DCEFCB',
  onTertiaryContainer: '#315F18',
  tertiaryFixed: '#C7E8AE',
  tertiaryFixedDim: '#A8D487',
  onTertiaryFixed: '#20251D',
  onTertiaryFixedVariant: '#315F18',

  error: '#D9534F',
  onError: '#ffffff',
  errorContainer: '#FBE3E1',
  onErrorContainer: '#8C2D2A',

  background: '#E7EBE4',
  onBackground: '#20251D',

  surface: '#E7EBE4',
  onSurface: '#20251D',
  surfaceVariant: '#F0F2EC',
  onSurfaceVariant: '#6B7168',
  surfaceDim: '#E8EBE3',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F5FAEC',
  surfaceContainer: '#F0F4E9',
  surfaceContainerHigh: '#EAF0E3',
  surfaceContainerHighest: '#E3E7DE',
  surfaceTint: '#78BE20',

  inverseSurface: '#20251D',
  inverseOnSurface: '#FAFAF7',

  outline: '#AEB6A8',
  outlineVariant: '#E3E7DE',

  glass: 'rgba(255,255,255,0.62)',
  glassHighlight: 'rgba(255,255,255,0.85)',
  glassEdge: 'rgba(32,37,29,0.10)',
} as const;

export type ColorToken = keyof typeof colors;