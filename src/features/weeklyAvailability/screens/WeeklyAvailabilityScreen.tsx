import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { useFamilyStore } from '../../../store/familyStore';
import { useAuthStore } from '../../../store/authStore';
import { useAvailabilityStore } from '../../../store/availabilityStore';
import { WEEK_DAYS, WEEK_MEALS } from '../../../shared/utils/week';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import BackHeader from '../../../shared/components/BackHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';

export default function WeeklyAvailabilityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { members, loadMembers } = useFamilyStore();
  const { availability, loadAvailability, updateAvailability } = useAvailabilityStore();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (currentUser) void loadMembers(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (members.length > 0 && selectedMemberId === null) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (selectedMemberId) {
      setIsDirty(false);
      void loadAvailability(selectedMemberId);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (isDirty) return;
    const next: Record<string, Record<string, boolean>> = {};
    for (const day of WEEK_DAYS) {
      const record = availability.find((a) => a.dayOfWeek === day);
      next[day] = {
        breakfast: record?.breakfast ?? true,
        lunch: record?.lunch ?? true,
        snack: record?.snack ?? true,
        dinner: record?.dinner ?? true,
      };
    }
    setDraft(next);
  }, [availability, isDirty]);

  const ownerId = members.find((m) => m.relationship === 'Self')?.id ?? members[0]?.id;
  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  const getMealState = (day: string, meal: (typeof WEEK_MEALS)[number]) => {
    return draft[day]?.[meal] ?? true;
  };

  const toggleMeal = (day: string, meal: (typeof WEEK_MEALS)[number]) => {
    setDraft((previous) => ({
      ...previous,
      [day]: { ...previous[day], [meal]: !previous[day]?.[meal] },
    }));
    setIsDirty(true);
  };

  const saveSchedule = () => {
    if (!selectedMemberId || !isDirty) return;
    confirmAction('Save weekly schedule?', 'Apply these availability changes to meal planning?', 'Save', () => {
      void (async () => {
        try {
          for (const day of WEEK_DAYS) {
            const row = draft[day];
            await updateAvailability(
              selectedMemberId,
              day,
              row.breakfast,
              row.lunch,
              row.snack,
              row.dinner
            );
          }
          setIsDirty(false);
          notify('Availability saved', `${selectedMember?.name ?? 'Member'}'s schedule was updated.`);
        } catch {
          notify('Could not save availability', 'Please try again.');
        }
      })();
    });
  };

  const discardSchedule = () => {
    if (!isDirty) return;
    confirmAction('Discard changes?', 'Your unsaved weekly schedule changes will be lost.', 'Discard', () => {
      const restored: Record<string, Record<string, boolean>> = {};
      for (const day of WEEK_DAYS) {
        const record = availability.find((a) => a.dayOfWeek === day);
        restored[day] = {
          breakfast: record?.breakfast ?? true,
          lunch: record?.lunch ?? true,
          snack: record?.snack ?? true,
          dinner: record?.dinner ?? true,
        };
      }
      setIsDirty(false);
      setDraft(restored);
    }, { destructive: true });
  };

  const copyFromOwner = async () => {
    if (!selectedMemberId || !ownerId || selectedMemberId === ownerId) return;
    const ownerAvail = await import('../../../services/database/availabilityRepository').then((m) =>
      m.getAvailabilityForMember(ownerId)
    );
    const copied: Record<string, Record<string, boolean>> = {};
    for (const day of WEEK_DAYS) {
      const record = ownerAvail.find((a) => a.dayOfWeek === day);
      copied[day] = {
        breakfast: record?.breakfast ?? true,
        lunch: record?.lunch ?? true,
        snack: record?.snack ?? true,
        dinner: record?.dinner ?? true,
      };
    }
    setDraft(copied);
    setIsDirty(true);
  };

  return (
    <View style={[styles.container, { padding: 0 }]}> 
      <BackHeader title="Weekly Availability" onBack={navigation.goBack} />
      <View style={{ flex: 1, padding: spacing.marginMobile }}>
      <Text style={styles.title}>Weekly Availability</Text>
      <Text style={styles.subtitle}>When will your family be eating at home?</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberTabs}>
        {members.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setSelectedMemberId(m.id)}
            style={[styles.memberTab, selectedMemberId === m.id && styles.memberTabActive]}
          >
            <Text
              style={
                selectedMemberId === m.id ? styles.memberTabTextActive : styles.memberTabText
              }
            >
              {m.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedMemberId && selectedMemberId !== ownerId && (
        <Pressable onPress={copyFromOwner} style={styles.copyButton}>
          <MaterialIcons name="content-copy" size={16} color={colors.primary} />
          <Text style={styles.copyButtonText}>Same as mine</Text>
        </Pressable>
      )}

      {selectedMemberId ? (
        <ScrollView>
          <View style={styles.grid}>
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.gridDay, styles.gridHeader]}>Day</Text>
              {WEEK_MEALS.map((meal) => (
                <Text key={meal} style={[styles.gridMeal, styles.gridHeader]}>
                  {meal.charAt(0).toUpperCase()}
                </Text>
              ))}
            </View>
            {WEEK_DAYS.map((day) => (
              <View key={day} style={styles.gridRow}>
                <Text style={styles.gridDay}>{day}</Text>
                {WEEK_MEALS.map((meal) => {
                  const on = getMealState(day, meal);
                  return (
                    <View key={meal} style={styles.gridMeal}>
                      <Pressable
                        onPress={() => toggleMeal(day, meal)}
                        style={[styles.toggle, on && styles.toggleOn]}
                      >
                        {on && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.empty}>Select a family member above to set their availability.</Text>
      )}
      {selectedMemberId && isDirty && (
        <View style={styles.footerActions}>
          <Pressable onPress={discardSchedule} style={styles.discardButton}>
            <Text style={styles.discardText}>Discard</Text>
          </Pressable>
          <Pressable onPress={saveSchedule} style={styles.saveButton}>
            <MaterialIcons name="save" size={18} color={colors.onPrimary} />
            <Text style={styles.saveText}>Save schedule</Text>
          </Pressable>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  memberTabs: { flexGrow: 0, marginBottom: spacing.sm },
  memberTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    marginRight: spacing.sm,
  },
  memberTabActive: { backgroundColor: colors.primary },
  memberTabText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  memberTabTextActive: { ...typography.labelLg, color: colors.onPrimary },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  copyButtonText: { ...typography.labelLg, fontSize: 13, color: colors.primary },
  grid: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.sm,
  },
  gridHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  gridHeader: { ...typography.labelLg, color: colors.onSurfaceVariant },
  gridDay: { width: 48, ...typography.bodyMd, color: colors.onSurface },
  gridMeal: { flex: 1, alignItems: 'center' },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  discardButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  discardText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  saveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveText: { ...typography.labelLg, color: colors.onPrimary },
});
