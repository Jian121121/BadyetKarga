// Directly matches the "spacing" scale from the Stitch tailwind.config,
// consistent across every screen (xs, sm, base, md, gutter, lg, xl, xxl,
// plus the two margin values used for page padding)

export const spacing = {
  xs: 4,
  sm: 8,
  base: 8,
  gutter: 16,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  marginMobile: 16,
  marginDesktop: 32,
} as const;

export type SpacingToken = keyof typeof spacing;