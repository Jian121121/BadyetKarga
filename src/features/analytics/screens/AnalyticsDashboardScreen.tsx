import { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';

const WEEKLY_BUDGET = 4500;

export default function AnalyticsDashboardScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems } = useGroceryStore();

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const totalSpent = items.reduce((sum, i) => sum + i.estimatedCost, 0);
  const moneySaved = Math.max(WEEKLY_BUDGET - totalSpent, 0);
  const utilizationPercent = Math.min(Math.round((totalSpent / WEEKLY_BUDGET) * 100), 100);
  const sortedByCost = [...items].sort((a, b) => b.estimatedCost - a.estimatedCost).slice(0, 5);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Insights & Analytics</Text>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Money Saved</Text>
          <Text style={styles.statValue}>₱{moneySaved.toFixed(2)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Budget Utilization</Text>
          <Text style={styles.statValue}>{utilizationPercent}%</Text>
        </Card>
      </View>

      <Card style={styles.wideCard}>
        <Text style={styles.statLabel}>Weekly Spending</Text>
        <Text style={styles.statValue}>₱{totalSpent.toFixed(2)}</Text>
        <Text style={styles.subLabel}>of ₱{WEEKLY_BUDGET.toFixed(2)} budget</Text>
      </Card>

      <Text style={styles.sectionTitle}>Most Purchased Ingredients</Text>
      <FlatList
        data={sortedByCost}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.ingredientRow}>
            <Text style={styles.ingredientName}>{item.ingredientName}</Text>
            <Text style={styles.ingredientCost}>₱{item.estimatedCost.toFixed(2)}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No spending data yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: { flex: 1 },
  wideCard: { marginBottom: spacing.md },
  statLabel: { ...typography.labelLg, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  statValue: { ...typography.headlineLgMobile, color: colors.primary, marginTop: 4 },
  subLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginVertical: spacing.sm },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  ingredientName: { ...typography.bodyLg, color: colors.onSurface },
  ingredientCost: { ...typography.titleMd, color: colors.secondary },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});