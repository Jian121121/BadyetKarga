// Font families and text style presets, extracted from the Stitch
// tailwind.config fontFamily/fontSize blocks (consistent across all screens)

export const fontFamily = {
  // Plus Jakarta Sans handles headlines/titles — the "brand" font
  headlineLg: 'PlusJakartaSans_700Bold',
  titleLg: 'PlusJakartaSans_600SemiBold',
  titleMd: 'PlusJakartaSans_600SemiBold',
  displayLg: 'PlusJakartaSans_700Bold',
  headlineLgMobile: 'PlusJakartaSans_700Bold',

  // Inter handles body text and labels — the "readable" font
  bodyLg: 'Inter_400Regular',
  bodyMd: 'Inter_400Regular',
  labelLg: 'Inter_500Medium',
} as const;

// Each preset bundles fontSize + lineHeight + fontWeight together,
// matching exactly what Stitch defined per text style.
// React Native's StyleSheet doesn't support letterSpacing as reliably
// across platforms, so we include it but treat it as a nice-to-have.

export const typography = {
  displayLg: {
    fontFamily: fontFamily.displayLg,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.4, // approx. -0.02em at this size
  },
  headlineLg: {
    fontFamily: fontFamily.headlineLg,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  headlineLgMobile: {
    fontFamily: fontFamily.headlineLgMobile,
    fontSize: 24,
    lineHeight: 32,
  },
  titleLg: {
    fontFamily: fontFamily.titleLg,
    fontSize: 22,
    lineHeight: 28,
  },
  titleMd: {
    fontFamily: fontFamily.titleMd,
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: fontFamily.bodyLg,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamily.bodyMd,
    fontSize: 14,
    lineHeight: 20,
  },
  labelLg: {
    fontFamily: fontFamily.labelLg,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export type TypographyToken = keyof typeof typography;  