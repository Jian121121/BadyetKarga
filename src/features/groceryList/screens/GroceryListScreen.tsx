import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'GroceryList'>;

export default function GroceryListScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, regenerate, toggleItem } = useGroceryStore();

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Grocery List</Text>
      <Text style={styles.total}>Total Estimated Cost: ₱{totalCost.toFixed(2)}</Text>

      <View style={styles.actionsRow}>
        <Button label="Regenerate from Meal Plan" onPress={() => currentUser && regenerate(currentUser.id)} />
      </View>
      <View style={styles.actionsRow}>
        <Button label="Optimize Budget" variant="outlined" onPress={() => navigation.navigate('BudgetOptimization')} style={styles.flexButton} />
        <Button label="Shopping Mode" variant="outlined" onPress={() => navigation.navigate('ShoppingMode')} style={styles.flexButton} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemRow}
            onPress={() => currentUser && toggleItem(item.id, !item.isChecked, currentUser.id)}
          >
            <Text style={[styles.itemName, item.isChecked && styles.itemChecked]}>{item.ingredientName}</Text>
            <Text style={styles.itemCost}>₱{item.estimatedCost.toFixed(2)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No grocery items yet. Plan some meals first.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface },
  total: { ...typography.titleLg, color: colors.primary, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  flexButton: { flex: 1 },
  list: { gap: spacing.xs, marginTop: spacing.md },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md,
  },
  itemName: { ...typography.bodyLg, color: colors.onSurface },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  itemCost: { ...typography.titleMd, color: colors.secondary },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg },
});