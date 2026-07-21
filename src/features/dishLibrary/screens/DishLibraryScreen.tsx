import { useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishLibrary'>;

// Placeholder images matching your Stitch dish photos, keyed by dish name
const DISH_IMAGES: Record<string, string> = {
  'Chicken Adobo': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdk1-DNm8DsfmqEXXcmS_-N_I6DFxyFdmEvMldyu7ast0WZ6ByV5OBHncLKpWzGa5zGoDnG2iApcyfBCRpINHudvwTRWZJMKLo4Yxjwfa-ks63lwdco0_IvwmqQREleF_Hiqje7HBBy7Xl-JJ10zy4BjaU0sLnCOoaUqqxqnh5cdeT10BnBO6KwQy-VJ-jhEDAJqXl3yxSevtms72PTzjb7a4e6rDZuCELkg9SK4KkAIwPbJHL-bd3RQ',
  'Sinigang na Hipon': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVb9IaK-Ki2aPcWepkShTa8rYyhMGmdvNnkRenKLaBE1l5zYdruK8PyXJCHW0J0at5v4AFKRNWVEXDUCRBJV0f6FpUdeVBsFse90U_-d2NkuB25qvdxIhnLAnJ-z1g5vEj-TfDB55aUrCpLI8ntUIzbPaCWcTILgyhzKbH1Q6MNrAImZ4HBb1cbfZcTgE5TptBF-Wohaye5tiX31IxlrkvvsqCb5i8lWFAOe7li9b4b42RWsuzoX7o_Q',
  'Ginisang Ampalaya': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmGha0Blt98rjVWrdzui6AqFcBcd3_wx2jH8mLPyfz8HTR6-VjcFjS2P_R93G0NirgU0q7MBKmPnMKkTJeSwbFsmvnNEJsOm0bENqYl8d4rWsTdwx7rqx_SickjGi6QxoZvNks3xa0-gfoIVYGFfrBHV2pR15839Yt7xW-0e7vOh4hFfAIRyrQ6GGQRV6jfnThWH7Xx9wj-lwyemPm-n8iCibHZEkPP3sdYBS3dq6kebALauDdpa1BGg',
  'Beef Pares': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmJJtKYRWjCW1Wv-UZBp3n60QSXh0BAnV7pxSNWzI_EdE92-nAK1lznEtHfYSg4-qrD1KChM84g1PoLffBgB3KlrxwP1UwkkqYeNaY425zXwyZfe9EAEW4txIt9-tELShmSv1m5GmeXTc4gMWKNA612jqNdUr05F-GuF2cTfAGWPluKDNqIywSwYtEdRMhWiT_G45lWQz5Fd4t2AMO7lesha_N4JJ2n2E0mQbW06KhJ9Tb-A10bNIgyw',
};

export default function DishLibraryScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { dishes, loadDishes, planMeal, selectedDay, selectedMealType } = useMealPlanStore();

  useEffect(() => {
    loadDishes();
  }, []);

  const handleAddToPlanner = async (dishId: number) => {
    if (!currentUser) return;
    await planMeal(currentUser.id, dishId, selectedDay, selectedMealType);
    navigation.navigate('MealPlanner');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Dish Library</Text>
      <Text style={styles.subtitle}>
        Adding to: {selectedDay} — {selectedMealType}
      </Text>

      <FlatList
        data={dishes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: DISH_IMAGES[item.name] ?? DISH_IMAGES['Chicken Adobo'] }}
              style={styles.image}
            />
            <View style={styles.content}>
              <View style={styles.rowBetween}>
                <Text style={styles.dishName}>{item.name}</Text>
                <Text style={styles.dishCost}>₱{item.estimatedCost}</Text>
              </View>
              <Text style={styles.category}>{item.category}</Text>
              <View style={styles.actions}>
                <Button
                  label="Add to Planner"
                  onPress={() => handleAddToPlanner(item.id)}
                  style={styles.addButton}
                />
                <Button
                  label="View"
                  variant="outlined"
                  onPress={() => navigation.navigate('DishDetails', { dishId: String(item.id) })}
                />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface },
  subtitle: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.md },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160 },
  content: { padding: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  dishName: { ...typography.titleLg, color: colors.onSurface },
  dishCost: { ...typography.titleMd, color: colors.secondary },
  category: { ...typography.labelLg, color: colors.tertiary, marginTop: 2, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  addButton: { flex: 1 },
});