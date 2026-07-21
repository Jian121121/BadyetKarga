import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { useFamilyStore } from '../../../store/familyStore';
import { useAuthStore } from '../../../store/authStore';
import { useAvailabilityStore } from '../../../store/availabilityStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'] as const;

export default function WeeklyAvailabilityScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { members, loadMembers } = useFamilyStore();
  const { availability, loadAvailability, updateAvailability } = useAvailabilityStore();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) loadMembers(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (selectedMemberId) loadAvailability(selectedMemberId);
  }, [selectedMemberId]);

  const getMealState = (day: string, meal: (typeof MEALS)[number]) => {
    const record = availability.find((a) => a.dayOfWeek === day);
    return record ? record[meal] : true; // default: available
  };

  const toggleMeal = (day: string, meal: (typeof MEALS)[number]) => {
    if (!selectedMemberId) return;
    const record = availability.find((a) => a.dayOfWeek === day);
    const current = {
      breakfast: record?.breakfast ?? true,
      lunch: record?.lunch ?? true,
      snack: record?.snack ?? true,
      dinner: record?.dinner ?? true,
    };
    current[meal] = !current[meal];
    updateAvailability(selectedMemberId, day, current.breakfast, current.lunch, current.snack, current.dinner);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Availability</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberTabs}>
        {members.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setSelectedMemberId(m.id)}
            style={[styles.memberTab, selectedMemberId === m.id && styles.memberTabActive]}
          >
            <Text style={selectedMemberId === m.id ? styles.memberTabTextActive : styles.memberTabText}>
              {m.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedMemberId ? (
        <ScrollView>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.mealsRow}>
                {MEALS.map((meal) => {
                  const isAvailable = getMealState(day, meal);
                  return (
                    <Pressable
                      key={meal}
                      onPress={() => toggleMeal(day, meal)}
                      style={[styles.mealChip, isAvailable && styles.mealChipActive]}
                    >
                      <Text style={isAvailable ? styles.mealChipTextActive : styles.mealChipText}>
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>Select a family member above to set their availability.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.md },
  memberTabs: { flexGrow: 0, marginBottom: spacing.md },
  memberTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.surfaceContainerHigh, marginRight: spacing.sm },
  memberTabActive: { backgroundColor: colors.primaryContainer },
  memberTabText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  memberTabTextActive: { ...typography.labelLg, color: colors.onPrimaryContainer },
  dayRow: { marginBottom: spacing.md },
  dayLabel: { ...typography.titleMd, color: colors.onSurface, marginBottom: spacing.xs },
  mealsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  mealChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: colors.outlineVariant },
  mealChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mealChipText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  mealChipTextActive: { ...typography.labelLg, color: colors.onPrimary },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.lg },
})