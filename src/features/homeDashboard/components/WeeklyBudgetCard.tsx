import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { calculateBudgetBreakdown } from '../../../shared/utils/householdServing';
import { formatBudgetBufferSummary } from '../../../algorithms/budgetBufferCalculator';

interface WeeklyBudgetCardProps {
  spent: number;
  total: number;
  daysLeft: number;
  bufferPercentage?: number;
  visitorBufferServings?: number;
  onPress?: () => void;
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WeeklyBudgetCard({
  spent,
  total,
  daysLeft,
  bufferPercentage = 0,
  visitorBufferServings = 0,
  onPress,
}: WeeklyBudgetCardProps) {
  const { reservedBuffer } = calculateBudgetBreakdown(total, bufferPercentage);
  const usableTotal = Math.max(0, total - reservedBuffer);
  const effectiveTotal = usableTotal > 0 ? usableTotal : total;
  const remaining = Math.max(effectiveTotal - spent, 0);
  const percentSpent =
    effectiveTotal > 0 ? Math.min(Math.round((spent / effectiveTotal) * 100), 100) : 0;

  const body = (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Weekly Budget</Text>
        <View style={styles.topRight}>
          {onPress ? <Text style={styles.editHint}>Edit</Text> : null}
          <MaterialIcons
            name="account-balance-wallet"
            size={28}
            color={colors.primary}
            style={styles.walletIcon}
          />
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountSpent}>{formatPeso(spent)}</Text>
        <Text style={styles.amountTotal}> / {formatPeso(total)}</Text>
      </View>

      <Text style={styles.remainingText}>
        {total > 0
          ? `You have ${formatPeso(remaining)} remaining in usable budget.`
          : 'Set a weekly budget in Profile to track spending.'}
      </Text>
      {total > 0 && bufferPercentage > 0 ? (
        <Text style={styles.bufferText}>{formatBudgetBufferSummary(bufferPercentage, total, visitorBufferServings)}</Text>
      ) : null}

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{percentSpent}% spent</Text>
        <Text style={styles.daysLeftLabel}>
          {daysLeft} day{daysLeft === 1 ? '' : 's'} left
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentSpent}%` }]} />
      </View>
    </Card>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Edit weekly budget">
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editHint: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.primary,
  },
  label: {
    ...typography.labelLg,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  walletIcon: {
    opacity: 0.35,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  amountSpent: {
    ...typography.displayLg,
    fontSize: 32,
    lineHeight: 40,
    color: colors.primary,
  },
  amountTotal: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
  remainingText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  bufferText: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
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
    height: 8,
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.default,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.default,
  },
});
