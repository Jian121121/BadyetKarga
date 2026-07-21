import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import Card from '../../../shared/components/Card';
import { useAuthStore } from '../../../store/authStore';
import { usePantryStore } from '../../../store/pantryStore';

export default function PantryScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, loadItems, addItem, removeItem } = usePantryStore();
  const [ingredientName, setIngredientName] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (currentUser) loadItems(currentUser.id);
  }, [currentUser]);

  const handleAdd = async () => {
    if (!currentUser || !ingredientName) return;
    await addItem(currentUser.id, ingredientName, quantity);
    setIngredientName('');
    setQuantity('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantry</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Text style={styles.itemName}>{item.ingredientName}</Text>
            {!!item.quantity && <Text style={styles.itemQty}>{item.quantity}</Text>}
            <Button label="Remove" variant="text" onPress={() => currentUser && removeItem(item.id, currentUser.id)} />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Pantry is empty.</Text>}
      />
      <Card style={styles.form}>
        <TextInput label="Ingredient" value={ingredientName} onChangeText={setIngredientName} />
        <TextInput label="Quantity (optional)" value={quantity} onChangeText={setQuantity} />
        <Button label="Add to Pantry" onPress={handleAdd} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { ...typography.titleMd, color: colors.onSurface },
  itemQty: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  form: { gap: spacing.sm, marginTop: spacing.md },
});