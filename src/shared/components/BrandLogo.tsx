import { View, Image, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { typography, spacing } from '../theme';

const MARK = require('../../../assets/logo-mark.png');
const FULL = require('../../../assets/logo-full.png');

const MARK_RATIO = 341 / 372;
const FULL_RATIO = 620 / 517;
/** Wordmark green sampled from the logo artwork. */
const BRAND_GREEN = '#2E7D32';

type Props = {
  /**
   * full   – bag + "BadyetKarga" artwork (use alone; never next to the name as text)
   * mark   – bag only
   * inline – bag + name as text, side by side (headers, form tops)
   */
  variant?: 'full' | 'mark' | 'inline';
  /** Height of the mark (inline/mark) or width of the full artwork. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandLogo({ variant = 'inline', size, style }: Props) {
  if (variant === 'full') {
    const width = size ?? 200;
    return (
      <View style={[styles.full, style]} accessible accessibilityRole="image" accessibilityLabel="BadyetKarga">
        <Image source={FULL} style={{ width, height: width / FULL_RATIO }} resizeMode="contain" />
      </View>
    );
  }

  const height = size ?? 32;
  const mark = (
    <Image source={MARK} style={{ width: height * MARK_RATIO, height }} resizeMode="contain" />
  );

  if (variant === 'mark') {
    return (
      <View style={style} accessible accessibilityRole="image" accessibilityLabel="BadyetKarga">
        {mark}
      </View>
    );
  }

  return (
    <View style={[styles.inline, style]} accessible accessibilityRole="header" accessibilityLabel="BadyetKarga">
      {mark}
      <Text
        style={[
          styles.wordmark,
          { fontSize: Math.round(height * 0.62), lineHeight: Math.round(height * 0.8) },
        ]}
        numberOfLines={1}
      >
        BadyetKarga
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wordmark: { ...typography.titleLg, color: BRAND_GREEN, letterSpacing: 0.2 },
});
