import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { optimizeBudget } from '../../../algorithms/budgetOptimizer';

const WEEKLY_BUDGET = 4500; // TODO: pull from real household setup data once Setup Wizard stores it

export default function BudgetOptimizationScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems } = useGroceryStore();

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const { totalCost, isOverBudget, suggestions } = optimizeBudget(items, WEEKLY_BUDGET);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Budget Optimization</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.label}>Estimated Cost</Text>
        <Text style={[styles.amount, isOverBudget && styles.over]}>₱{totalCost.toFixed(2)}</Text>
        <Text style={styles.subLabel}>Weekly Budget: ₱{WEEKLY_BUDGET.toFixed(2)}</Text>
        <Text style={[styles.status, isOverBudget ? styles.statusOver : styles.statusOk]}>
          {isOverBudget ? 'Over Budget' : 'Within Budget'}
        </Text>
      </Card>

      {isOverBudget && (
        <>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          <FlatList
            data={suggestions}
            keyExtractor={(item, idx) => `${item.itemName}-${idx}`}
            renderItem={({ item }) => (
              <Card style={styles.suggestionCard}>
                <Text style={styles.suggestionText}>{item.suggestion}</Text>
                <Text style={styles.savingsText}>Potential savings: ₱{item.potentialSavings}</Text>
              </Card>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing.md },
  summaryCard: { marginBottom: spacing.md },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  amount: { ...typography.displayLg, color: colors.primary },
  over: { color: colors.error },
  subLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  status: { ...typography.titleMd, marginTop: spacing.sm },
  statusOk: { color: colors.primary },
  statusOver: { color: colors.error },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.sm },
  suggestionCard: { marginBottom: spacing.sm },
  suggestionText: { ...typography.bodyLg, color: colors.onSurface },
  savingsText: { ...typography.labelLg, color: colors.tertiary, marginTop: 4 },
});