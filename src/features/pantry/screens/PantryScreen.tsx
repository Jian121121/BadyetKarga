import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import TextInput from '../../../shared/components/TextInput';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { usePantryStore } from '../../../store/pantryStore';
import type { PantryItem } from '../../../services/database/pantryRepository';
import { ingredientKey } from '../../../shared/utils/ingredientKey';
import { isPantryQuantity } from '../../../shared/utils/validation';
import BackHeader from '../../../shared/components/BackHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';

const COMMON_PANTRY_ITEMS = [
  'Rice', 'Salt', 'Pepper', 'Garlic', 'Onion', 'Soy Sauce',
  'Vinegar', 'Cooking Oil', 'Sugar', 'Flour', 'Eggs', 'Milk',
];

export default function PantryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, addItem, removeItem, clearAll } = usePantryStore();
  const [ingredientName, setIngredientName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (currentUser) void loadItems(currentUser.id);
  }, [currentUser?.id]);

  const stockedKeys = new Set(items.map((item) => ingredientKey(item.ingredientName)));

  const confirmRemove = (item: PantryItem) => {
    if (!currentUser) return;
    confirmAction(
      'Remove pantry item?',
      `Remove ${item.ingredientName}? It may appear on your grocery list again.`,
      'Remove',
      () => {
        void removeItem(item.id, currentUser.id).catch(() =>
          notify('Could not remove item', 'Please try again.')
        );
      },
      { destructive: true }
    );
  };

  const handleQuickChip = (name: string) => {
    const existing = items.find((item) => ingredientKey(item.ingredientName) === ingredientKey(name));
    if (existing) confirmRemove(existing);
    else addPantryItem(name, 'on hand');
  };

  const addPantryItem = (name: string, amount: string) => {
    if (!currentUser) return;
    confirmAction(
      'Add pantry item?',
      `Mark ${name} as available at home${amount ? ` (${amount})` : ''}?`,
      'Add',
      () => {
        void addItem(currentUser.id, name, amount)
          .then(() => notify('Pantry updated', `${name} will be excluded from grocery needs.`))
          .catch((err) => notify('Could not add item', err instanceof Error ? err.message : 'Please try again.'));
      }
    );
  };

  const handleAdd = () => {
    if (!currentUser) return;
    if (!ingredientName.trim()) {
      notify('Ingredient needed', 'Type the ingredient you have at home, e.g. Kangkong.');
      return;
    }
    if (!isPantryQuantity(quantity)) {
      notify('Invalid quantity', 'Use a value such as 1 kg, 500 g, 2 pcs, or “on hand”.');
      return;
    }
    addPantryItem(ingredientName.trim(), quantity.trim());
    setIngredientName('');
    setQuantity('');
    setFormVisible(false);
  };

  const handleClearAll = () => {
    if (!currentUser) return;
    if (items.length === 0) {
      notify('Pantry already clear', 'There are no pantry items to remove.');
      return;
    }
    confirmAction(
      'Clear pantry?',
      'Remove every pantry item? Those ingredients may appear in future grocery lists again.',
      'Clear all',
      () => {
        void clearAll(currentUser.id)
          .then(() => notify('Pantry cleared', 'Grocery needs were recalculated.'))
          .catch(() => notify('Could not clear pantry', 'Please try again.'));
      },
      { destructive: true }
    );
  };

  return (
    <View style={styles.root}>
      <BackHeader title="Pantry" onBack={navigation.goBack} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>Use what you have</Text>
                <Text style={styles.subtitle}>Pantry items reduce grocery needs and meal cost.</Text>
              </View>
              <Pressable onPress={() => setFormVisible(true)} style={styles.addCircle} accessibilityLabel="Add pantry item">
                <MaterialIcons name="add" size={25} color={colors.onPrimary} />
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick add</Text>
              {items.length > 0 && (
                <Pressable onPress={handleClearAll} hitSlop={8}>
                  <Text style={styles.clearText}>Clear all</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.quickGrid}>
              {COMMON_PANTRY_ITEMS.map((item) => {
                const stocked = stockedKeys.has(ingredientKey(item));
                return (
                  <Pressable
                    key={item}
                    onPress={() => handleQuickChip(item)}
                    style={[styles.quickChip, stocked && styles.quickChipOn]}
                    accessibilityState={{ selected: stocked }}
                  >
                    <MaterialIcons
                      name={stocked ? 'check' : 'add'}
                      size={15}
                      color={stocked ? colors.onPrimaryContainer : colors.primary}
                    />
                    <Text style={[styles.quickChipText, stocked && styles.quickChipTextOn]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            {formVisible && (
              <Card style={styles.form}>
                <Text style={styles.formTitle}>Add another ingredient</Text>
                <TextInput label="Ingredient" value={ingredientName} onChangeText={setIngredientName} placeholder="e.g. Kangkong" />
                <TextInput label="Quantity (optional)" value={quantity} onChangeText={setQuantity} placeholder="e.g. 2 bunches or on hand" />
                <View style={styles.formActions}>
                  <Button label="Cancel" variant="text" onPress={() => setFormVisible(false)} />
                  <Button label="Add to Pantry" onPress={handleAdd} />
                </View>
              </Card>
            )}

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>My pantry</Text>
              <Text style={styles.itemCount}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <MaterialIcons name="inventory-2" size={19} color={colors.primary} />
            </View>
            <View style={styles.itemCopy}>
              <Text style={styles.itemName}>{item.ingredientName}</Text>
              <Text style={styles.itemQty}>{item.quantity || 'On hand'}</Text>
            </View>
            <Pressable
              onPress={() => confirmRemove(item)}
              hitSlop={10}
              accessibilityLabel={`Remove ${item.ingredientName}`}
            >
              <MaterialIcons name="delete-outline" size={21} color={colors.error} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No ingredients yet. Use Quick add or the plus button.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  titleCopy: { flex: 1 },
  title: { ...typography.headlineLgMobile, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  addCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { ...typography.titleMd, color: colors.onSurface },
  clearText: { ...typography.labelLg, color: colors.error },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 7, backgroundColor: colors.surfaceContainerLowest },
  quickChipText: { ...typography.labelLg, fontSize: 12, color: colors.onSurface },
  quickChipOn: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  quickChipTextOn: { color: colors.onPrimaryContainer },
  form: { gap: spacing.xs, marginBottom: spacing.lg },
  formTitle: { ...typography.titleMd, color: colors.onSurface, marginBottom: spacing.xs },
  formActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemCount: { ...typography.labelLg, color: colors.onSurfaceVariant },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  itemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer },
  itemCopy: { flex: 1 },
  itemName: { ...typography.titleMd, color: colors.onSurface },
  itemQty: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.lg },
});
