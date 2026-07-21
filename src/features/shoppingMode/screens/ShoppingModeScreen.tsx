import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import TextInput from '../../../shared/components/TextInput';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';

const WEEKLY_BUDGET = 4500; // TODO: pull from real household setup data

export default function ShoppingModeScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, toggleItem } = useGroceryStore();
  const [actualPrices, setActualPrices] = useState<Record<number, string>>({});

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const actualTotal = items.reduce((sum, item) => {
    const actual = actualPrices[item.id];
    const price = actual !== undefined && actual !== '' ? parseFloat(actual) : item.estimatedCost;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const remaining = WEEKLY_BUDGET - actualTotal;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Shopping Mode</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.remainingLabel}>Remaining Budget</Text>
        <Text style={[styles.remainingAmount, remaining < 0 && styles.negative]}>
          ₱{remaining.toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Pressable
              style={styles.checkbox}
              onPress={() => currentUser && toggleItem(item.id, !item.isChecked, currentUser.id)}
            >
              <Text>{item.isChecked ? '☑' : '☐'}</Text>
            </Pressable>
            <Text style={[styles.itemName, item.isChecked && styles.itemChecked]}>
              {item.ingredientName}
            </Text>
            <TextInput
              label=""
              value={actualPrices[item.id] ?? ''}
              onChangeText={(text) => setActualPrices((prev) => ({ ...prev, [item.id]: text }))}
              keyboardType="numeric"
              placeholder={`₱${item.estimatedCost}`}
              style={styles.priceInput}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items to shop for yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing.md },
  summaryRow: {
    backgroundColor: colors.primaryContainer, borderRadius: radii.xl, padding: spacing.md,
    marginBottom: spacing.md,
  },
  remainingLabel: { ...typography.labelLg, color: colors.onPrimaryContainer, textTransform: 'uppercase' },
  remainingAmount: { ...typography.displayLg, color: colors.onPrimaryContainer },
  negative: { color: colors.error },
  list: { gap: spacing.sm },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.sm,
  },
  checkbox: { padding: spacing.xs },
  itemName: { ...typography.bodyLg, color: colors.onSurface, flex: 1 },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  priceInput: { width: 100 },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});