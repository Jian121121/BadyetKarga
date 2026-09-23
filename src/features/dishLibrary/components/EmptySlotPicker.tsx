import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export default function EmptySlotPicker({
  visible,
  slots,
  selected,
  onClose,
  onSelect,
}: EmptySlotPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Add to a free day</Text>
          <Text style={styles.subtitle}>
            Only days and meals that do not have a dish yet are shown.
          </Text>
          {slots.length === 0 ? (
            <Text style={styles.empty}>Every available meal slot already has a dish.</Text>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {slots.map((slot) => {
                const isSelected = selected?.day === slot.day && selected?.meal === slot.meal;
                return (
                  <Pressable
                    key={`${slot.day}-${slot.meal}`}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => onSelect(slot.day, slot.meal)}
                  >
                    <View>
                      <Text style={[styles.optionDay, isSelected && styles.optionSelectedText]}>
                        {slot.day}
                      </Text>
                      <Text style={styles.optionMeal}>{slot.meal}</Text>
                    </View>
                    {isSelected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.marginMobile,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '80%',
  },
  title: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingVertical: spacing.md,
  },
  list: {
    maxHeight: 360,
  },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  optionSelected: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
  },
  optionDay: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
  },
  optionMeal: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  optionSelectedText: {
    color: colors.primary,
  },
});
