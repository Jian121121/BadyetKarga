import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'GroceryList'>;

const PRIORITY_COLOR = {
  high: '#ba1a1a',
  medium: '#7e5700',
  low: '#40493d',
};

export default function GroceryListScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, regenerate, toggleItem, editPrice } = useGroceryStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);

  const handleSavePrice = async (id: number) => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && currentUser) {
      await editPrice(id, parsed, currentUser.id);
    }
    setEditingId(null);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Grocery List</Text>
      <Text style={styles.total}>Total Estimated Cost: ₱{totalCost.toFixed(2)}</Text>
      <Text style={styles.disclaimer}>Prices are estimates — tap any price to edit it.</Text>

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
          <View style={styles.itemCard}>
            <Pressable
              style={styles.checkRow}
              onPress={() => currentUser && toggleItem(item.id, !item.isChecked, currentUser.id)}
            >
              <Text style={styles.checkbox}>{item.isChecked ? '☑' : '☐'}</Text>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.isChecked && styles.itemChecked]}>
                  {item.ingredientName}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} {item.unit} • <Text style={{ color: PRIORITY_COLOR[item.priority] }}>{item.priority}</Text>
                </Text>
                <Text style={styles.usedIn}>Used in: {item.usedInDishes}</Text>
              </View>
            </Pressable>

            {editingId === item.id ? (
              <View style={styles.editRow}>
                <TextInput
                  label=""
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="numeric"
                  autoFocus
                />
                <Button label="Save" onPress={() => handleSavePrice(item.id)} />
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setEditingId(item.id);
                  setEditValue(String(item.estimatedCost));
                }}
              >
                <Text style={styles.itemCost}>₱{item.estimatedCost.toFixed(2)}</Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No grocery items yet. Plan some meals first.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface },
  total: { ...typography.titleLg, color: colors.primary, marginTop: 4 },
  disclaimer: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  flexButton: { flex: 1 },
  list: { gap: spacing.sm, marginTop: spacing.md },
  itemCard: {
    backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl,
    borderWidth: 1, borderColor: colors.outlineVariant, padding: spacing.md,
  },
  checkRow: { flexDirection: 'row', gap: spacing.sm },
  checkbox: { fontSize: 20 },
  itemInfo: { flex: 1 },
  itemName: { ...typography.bodyLg, color: colors.onSurface },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  itemMeta: { ...typography.labelLg, color: colors.onSurfaceVariant, marginTop: 2 },
  usedIn: { ...typography.labelLg, color: colors.tertiary, marginTop: 2, fontStyle: 'italic' },
  itemCost: { ...typography.titleMd, color: colors.secondary, marginTop: spacing.sm, textAlign: 'right' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg },
});