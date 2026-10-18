import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';

interface FamilyCountCardProps {
  count: number;
}

export default function FamilyCountCard({ count }: FamilyCountCardProps) {
  return (
    <View style={styles.card}>
      <MaterialIcons name="group" size={28} color={colors.onPrimary} />
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>Family Members</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  count: {
    ...typography.displayLg,
    fontSize: 40,
    lineHeight: 48,
    color: colors.onPrimary,
  },
  label: {
    ...typography.labelLg,
    color: colors.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
  },
});
