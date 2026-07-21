import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { useAuthStore } from '../../../store/authStore';
import { useMealPlanStore } from '../../../store/mealPlanStore';

type Props = NativeStackScreenProps<PlannerStackParamList, 'MealPlanner'>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function MealPlannerScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { entries, loadEntries, setSelection } = useMealPlanStore();

  useEffect(() => {
    if (currentUser) loadEntries(currentUser.id);
  }, [currentUser]);

  const getEntry = (day: string, mealType: string) =>
    entries.find((e) => e.dayOfWeek === day && e.mealType === mealType);

  const handleSlotPress = (day: string, mealType: string) => {
    setSelection(day, mealType);
    navigation.navigate('DishLibrary');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Weekly Planner</Text>
      <ScrollView>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{day}</Text>
            {MEAL_TYPES.map((mealType) => {
              const entry = getEntry(day, mealType);
              return (
                <Pressable
                  key={mealType}
                  style={[styles.slot, entry && styles.slotFilled]}
                  onPress={() => handleSlotPress(day, mealType)}
                >
                  <Text style={styles.slotLabel}>{mealType.toUpperCase()}</Text>
                  {entry ? (
                    <>
                      <Text style={styles.dishName}>{entry.dishName}</Text>
                      <Text style={styles.dishCost}>₱{entry.estimatedCost}</Text>
                    </>
                  ) : (
                    <Text style={styles.emptySlot}>+ Add {mealType}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLg, color: colors.onSurface, marginBottom: spacing.md },
  dayBlock: { marginBottom: spacing.lg },
  dayLabel: { ...typography.titleLg, color: colors.primary, marginBottom: spacing.sm },
  slot: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  slotFilled: { borderColor: colors.primary },
  slotLabel: { ...typography.labelLg, color: colors.secondary, fontWeight: 'bold' },
  dishName: { ...typography.titleMd, color: colors.onSurface, marginTop: 4 },
  dishCost: { ...typography.bodyMd, color: colors.tertiary, marginTop: 2 },
  emptySlot: { ...typography.bodyMd, color: colors.outline, marginTop: 4 },
});