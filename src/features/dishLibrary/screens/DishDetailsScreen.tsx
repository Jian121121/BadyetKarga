import { View, Text, Image, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishDetails'>;

const DISH_IMAGES: Record<string, string> = {
  '1': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdk1-DNm8DsfmqEXXcmS_-N_I6DFxyFdmEvMldyu7ast0WZ6ByV5OBHncLKpWzGa5zGoDnG2iApcyfBCRpINHudvwTRWZJMKLo4Yxjwfa-ks63lwdco0_IvwmqQREleF_Hiqje7HBBy7Xl-JJ10zy4BjaU0sLnCOoaUqqxqnh5cdeT10BnBO6KwQy-VJ-jhEDAJqXl3yxSevtms72PTzjb7a4e6rDZuCELkg9SK4KkAIwPbJHL-bd3RQ',
};

export default function DishDetailsScreen({ route, navigation }: Props) {
  const { dishId } = route.params;
  const currentUser = useAuthStore((s) => s.currentUser);
  const { dishes, planMeal, selectedDay, selectedMealType } = useMealPlanStore();

  const dish = dishes.find((d) => String(d.id) === dishId);

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

  return (
    <View style={styles.root}>
      <Image source={{ uri: DISH_IMAGES[dishId] ?? DISH_IMAGES['1'] }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{dish.name}</Text>
        <Text style={styles.meta}>{dish.category} • {dish.prepTimeMinutes} min • ₱{dish.estimatedCost}</Text>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        <Text style={styles.body}>Ingredient list coming in Phase 14 (Automatic Grocery List).</Text>
        <Button label={`Add to ${selectedDay} ${selectedMealType}`} onPress={handleAddToPlan} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 220 },
  content: { padding: spacing.marginMobile },
  name: { ...typography.headlineLg, color: colors.onSurface },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing.md },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  button: { marginTop: spacing.xl },
});