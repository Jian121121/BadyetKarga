import { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useAuthStore } from '../../../store/authStore';
import { getIngredientsForDish, type DishIngredient } from '../../../services/database/dishIngredientRepository';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishDetails'>;

export default function DishDetailsScreen({ route, navigation }: Props) {
  const { dishId } = route.params;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { dishes, planMeal, selectedDay, selectedMealType } = useMealPlanStore();
  const [ingredients, setIngredients] = useState<DishIngredient[]>([]);

  const dish = dishes.find((d) => String(d.id) === dishId);

  useEffect(() => {
    if (dish) {
      getIngredientsForDish(dish.id).then(setIngredients);
    }
  }, [dish]);

  const handleAddToPlan = async () => {
    if (!currentUser || !dish) return;
    await planMeal(currentUser.id, dish.id, selectedDay, selectedMealType);
    navigation.navigate('MealPlanner');
  };

  if (!dish) {
    return (
      <View style={styles.center}>
        <Text>Dish not found.</Text>
      </View>
    );
  }

  const totalCost = ingredients.reduce((sum, i) => sum + i.estimatedPrice, 0);

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.name}>{dish.name}</Text>
        <Text style={styles.meta}>{dish.category} • {dish.prepTimeMinutes} min</Text>

        <Text style={styles.sectionTitle}>Complete Ingredient List</Text>
        <Text style={styles.disclaimer}>Estimated prices — actual costs may vary by store/market.</Text>

        <FlatList
          data={ingredients}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.ingredientName}</Text>
                <Text style={styles.ingredientQty}>{item.quantity} {item.unit} • {item.priority}</Text>
              </View>
              <Text style={styles.ingredientPrice}>₱{item.estimatedPrice.toFixed(2)}</Text>
            </View>
          )}
        />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Estimated Cost</Text>
          <Text style={styles.totalValue}>₱{totalCost.toFixed(2)}</Text>
        </View>

        <Button label={`Add to ${selectedDay} ${selectedMealType}`} onPress={handleAddToPlan} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.marginMobile, flex: 1 },
  name: { ...typography.headlineLg, color: colors.onSurface },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing.md },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginTop: spacing.md },
  disclaimer: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  ingredientRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant,
  },
  ingredientInfo: { flex: 1 },
  ingredientName: { ...typography.bodyLg, color: colors.onSurface },
  ingredientQty: { ...typography.labelLg, color: colors.onSurfaceVariant },
  ingredientPrice: { ...typography.titleMd, color: colors.secondary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 2, borderTopColor: colors.primary },
  totalLabel: { ...typography.titleMd, color: colors.onSurface },
  totalValue: { ...typography.titleLg, color: colors.primary },
  button: { marginTop: spacing.xl },
});