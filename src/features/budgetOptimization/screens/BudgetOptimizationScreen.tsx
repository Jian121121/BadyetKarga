import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { optimizeBudget } from '../../../algorithms/budgetOptimizer';
import { formatBudgetBufferSummary } from '../../../algorithms/budgetBufferCalculator';
import { confirmAction, notify } from '../../../shared/utils/confirm';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'BudgetOptimization'>;

export default function BudgetOptimizationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, removeItem, updateItem } = useGroceryStore();
  const settings = useHouseholdStore((s) => s.settings);

  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const bufferPercentage = settings?.budgetBufferPercentage ?? 0;

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser?.id]);

  const {
    totalCost,
    reservedBuffer,
    usableBudget,
    isOverBudget,
    overAmount,
    projectedSavings,
    projectedCost,
    suggestions,
  } = optimizeBudget(items, weeklyBudget, bufferPercentage);

  const applySuggestion = (suggestion: (typeof suggestions)[number]) => {
    if (!currentUser) return;
    const item = items.find((candidate) => candidate.ingredientName === suggestion.itemName);
    if (!item) {
      notify('Item no longer available', 'Regenerate the grocery list and review recommendations again.');
      return;
    }
    confirmAction(
      'Apply recommendation?',
      `${suggestion.title}. This will update the current grocery list.`,
      'Apply',
      () => {
        void (async () => {
          if (suggestion.type === 'optional_removal') {
            await removeItem(item.id, currentUser.id);
          } else {
            await updateItem(item.id, currentUser.id, {
              ingredientName: suggestion.replacementName,
              estimatedCost: Math.max(0, item.estimatedCost - suggestion.potentialSavings),
            });
          }
          notify('Recommendation applied', 'Your current grocery list was updated.');
        })();
      }
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Budget Optimization</Text>
        <View style={{ width: 24 }} />
      </View>

      <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
        <MaterialIcons name="shopping-cart" size={16} color={colors.primary} />
        <Text style={styles.backLinkText}>Back to Groceries</Text>
      </Pressable>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={styles.label}>Estimated Grocery Cost</Text>
                  <Text style={[styles.amount, isOverBudget && styles.over]}>
                    ₱{totalCost.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isOverBudget ? styles.statusPillOver : styles.statusPillOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isOverBudget ? styles.statusOver : styles.statusOk,
                    ]}
                  >
                    {isOverBudget ? `₱${overAmount.toFixed(0)} Over` : 'Within Budget'}
                  </Text>
                </View>
              </View>

              <View style={styles.breakdownGrid}>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>TOTAL BUDGET</Text>
                  <Text style={styles.gridValue}>₱{weeklyBudget.toFixed(2)}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>RESERVED BUFFER</Text>
                  <Text style={styles.gridReserved}>₱{reservedBuffer.toFixed(2)}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>USABLE BUDGET</Text>
                  <Text style={styles.gridUsable}>₱{usableBudget.toFixed(2)}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.gridLabel}>PROJECTED SAVINGS</Text>
                  <Text style={styles.gridSavings}>₱{projectedSavings.toFixed(2)}</Text>
                </View>
              </View>

              {weeklyBudget > 0 && (
                <Text style={styles.bufferSummary}>
                  {formatBudgetBufferSummary(bufferPercentage, weeklyBudget, settings?.visitorBufferServings ?? 0)}
                </Text>
              )}

              {isOverBudget && (
                <View style={styles.projectedBox}>
                  <MaterialIcons name="trending-down" size={18} color={colors.primary} />
                  <Text style={styles.projectedText}>
                    Applying recommendations lowers spending to ₱{projectedCost.toFixed(2)} (within usable budget).
                  </Text>
                </View>
              )}
            </Card>

            <Text style={styles.sectionTitle}>
              {suggestions.length > 0 ? 'Smart Optimization Suggestions' : 'No Optimization Needed'}
            </Text>
            {suggestions.length === 0 && (
              <Card style={styles.emptyCard}>
                <MaterialIcons name="check-circle" size={32} color={colors.primary} />
                <Text style={styles.emptyTitle}>Great budget balance!</Text>
                <Text style={styles.emptySubtitle}>
                  Your planned groceries comfortably fit inside your ₱{usableBudget.toFixed(2)} usable budget.
                </Text>
              </Card>
            )}
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <View style={styles.suggestionTitleWrap}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.currentCostText}>Current cost: ₱{item.currentCost.toFixed(2)}</Text>
              </View>
              <View style={styles.savingsPill}>
                <Text style={styles.savingsPillText}>Save ₱{item.potentialSavings}</Text>
              </View>
            </View>

            <Text style={styles.suggestionText}>{item.suggestion}</Text>
            {!!item.actionableHint && (
              <Text style={styles.actionableHint}>💡 {item.actionableHint}</Text>
            )}
            <Pressable style={styles.applyButton} onPress={() => applySuggestion(item)}>
              <Text style={styles.applyButtonText}>Apply recommendation</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.marginMobile,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    height: 44,
  },
  title: { ...typography.titleLg, color: colors.onSurface },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backLinkText: { ...typography.labelLg, color: colors.primary },
  summaryCard: { marginBottom: spacing.md, gap: spacing.sm },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  amount: { ...typography.displayLg, fontSize: 28, color: colors.primary },
  over: { color: colors.error },
  statusPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.default,
  },
  statusPillOk: { backgroundColor: colors.primaryContainer },
  statusPillOver: { backgroundColor: '#fde8e8' },
  statusPillText: { ...typography.labelLg, fontSize: 12 },
  statusOk: { color: colors.primary },
  statusOver: { color: colors.error },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  gridBox: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.xs + 2,
  },
  gridLabel: { ...typography.labelLg, fontSize: 9, color: colors.onSurfaceVariant },
  gridValue: { ...typography.titleMd, fontSize: 13, color: colors.onSurface, marginTop: 2 },
  gridReserved: { ...typography.titleMd, fontSize: 13, color: colors.error, marginTop: 2 },
  gridUsable: { ...typography.titleMd, fontSize: 13, color: colors.primary, marginTop: 2 },
  gridSavings: { ...typography.titleMd, fontSize: 13, color: colors.tertiary, marginTop: 2 },
  bufferSummary: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  projectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginTop: 2,
  },
  projectedText: { ...typography.bodyMd, fontSize: 12, color: colors.primary, flex: 1 },
  sectionTitle: {
    ...typography.titleLg,
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: { ...typography.titleMd, color: colors.onSurface },
  emptySubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  suggestionCard: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  suggestionTitleWrap: { flex: 1 },
  suggestionTitle: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
  currentCostText: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  savingsPill: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  savingsPillText: { ...typography.labelLg, fontSize: 11, color: colors.primary, fontWeight: '700' },
  suggestionText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  actionableHint: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing.xs + 2,
    borderRadius: radii.lg,
    marginTop: 2,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  applyButtonText: { ...typography.labelLg, color: colors.primary },
});
