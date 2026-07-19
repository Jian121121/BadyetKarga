// Border radius scale from Stitch's tailwind.config borderRadius block

export const radii = {
  none: 0,
  default: 4,   // 0.25rem
  lg: 8,        // 0.5rem
  xl: 12,       // 0.75rem
  full: 9999,   // pill/circle shape
} as const;

export type RadiusToken = keyof typeof radii;