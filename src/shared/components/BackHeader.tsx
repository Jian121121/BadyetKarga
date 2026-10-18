import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

export default function BackHeader({ title, onBack, right }: BackHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top, minHeight: 52 + insets.top }]}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={10} accessibilityLabel="Go back">
        <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  title: {
    ...typography.titleMd,
    color: colors.onSurface,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  right: { minWidth: 40, maxWidth: 150, alignItems: 'flex-end' },
  placeholder: { width: 40, height: 40 },
});
