import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../../../shared/theme';

export type OpenMealSlot = { day: string; meal: string };

interface EmptySlotPickerProps {
  visible: boolean;
  slots: OpenMealSlot[];
  selected?: OpenMealSlot | null;
  onClose: () => void;
  onSelect: (day: string, meal: string) => void;
}

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const MEAL_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  breakfast: 'free-breakfast',
  lunch: 'lunch-dining',
  snack: 'cookie',
  dinner: 'dinner-dining',
};

function groupByDay(slots: OpenMealSlot[]) {
  const groups: Array<{ day: string; meals: string[] }> = [];
  for (const slot of slots) {
    const group = groups.find((g) => g.day === slot.day);
    if (group) group.meals.push(slot.meal);
    else groups.push({ day: slot.day, meals: [slot.meal] });
  }
  return groups;
}

export default function EmptySlotPicker({
  visible,
  slots,
  selected,
  onClose,
  onSelect,
}: EmptySlotPickerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 420);
  const groups = groupByDay(slots);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to a free meal</Text>
          <Text style={styles.subtitle}>
            {slots.length > 0
              ? `${slots.length} open meal${slots.length === 1 ? '' : 's'} left this week. Pick where this dish goes.`
              : 'Only meals without a dish are shown here.'}
          </Text>

          {slots.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="event-available" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your week is full</Text>
              <Text style={styles.emptyBody}>Every meal already has a dish. Remove one in the Planner to free a slot.</Text>
            </View>
          ) : (
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {groups.map((group) => (
                <View key={group.day} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayName}>{DAY_NAMES[group.day] ?? group.day}</Text>
                    <Text style={styles.dayCount}>
                      {group.meals.length} open
                    </Text>
                  </View>
                  <View style={styles.mealRow}>
                    {group.meals.map((meal) => {
                      const isSelected = selected?.day === group.day && selected?.meal === meal;
                      return (
                        <Pressable
                          key={meal}
                          style={[styles.mealChip, isSelected && styles.mealChipSelected]}
                          onPress={() => onSelect(group.day, meal)}
                          accessibilityLabel={`${DAY_NAMES[group.day] ?? group.day} ${meal}`}
                        >
                          <MaterialIcons
                            name={MEAL_ICONS[meal] ?? 'restaurant'}
                            size={18}
                            color={isSelected ? colors.primary : colors.onSurfaceVariant}
                          />
                          <Text style={[styles.mealText, isSelected && styles.mealTextSelected]}>{meal}</Text>
                          {isSelected && <MaterialIcons name="check" size={16} color={colors.primary} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.marginMobile,
    gap: spacing.xs,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  title: { ...typography.titleLg, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  dayGroup: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayName: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
  dayCount: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  mealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  mealChipSelected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  mealText: { ...typography.labelLg, fontSize: 13, color: colors.onSurfaceVariant, textTransform: 'capitalize' },
  mealTextSelected: { color: colors.primary },
  emptyWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { ...typography.titleMd, color: colors.onSurface },
  emptyBody: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
});
