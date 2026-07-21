import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';

interface WeeklyBudgetCardProps {
  spent: number;
  total: number;
  daysLeft: number;
}

export default function WeeklyBudgetCard({ spent, total, daysLeft }: WeeklyBudgetCardProps) {
  const remaining = total - spent;
  const percentSpent = Math.min(Math.round((spent / total) * 100), 100);

  return (
    <Card style={styles.card}>
      <View style={styles.iconBadge}>
        <MaterialIcons name="account-balance-wallet" size={32} color={colors.primaryContainer} />
      </View>

      <Text style={styles.label}>Weekly Budget</Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountSpent}>₱{spent.toLocaleString()}.00</Text>
        <Text style={styles.amountTotal}> / ₱{total.toLocaleString()}.00</Text>
      </View>

      <Text style={styles.remainingText}>
        You have ₱{remaining.toLocaleString()}.00 remaining for the week.
      </Text>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{percentSpent}% spent</Text>
        <Text style={styles.daysLeftLabel}>{daysLeft} days left</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentSpent}%` }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    opacity: 0.2,
  },
  label: {
    ...typography.titleLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  amountSpent: {
    ...typography.displayLg,
    color: colors.primary,
  },
  amountTotal: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  remainingText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: 'bold',
  },
  daysLeftLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  progressTrack: {
    height: 16,
    width: '100%',
    backgroundColor: colors.primaryFixedDim + '33', // ~20% opacity, matching Stitch's /20
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
});     