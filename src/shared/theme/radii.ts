// Border radius scale from Stitch's tailwind.config borderRadius block

export const radii = {
  none: 0,
  default: 12,
  lg: 18,
  xl: 24,
  full: 9999,   // pill/circle shape
} as const;

export type RadiusToken = keyof typeof radii;