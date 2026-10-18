import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useAuthStore } from '../../../store/authStore';
import { useSetupWizardStore, WIZARD_DAYS, WIZARD_MEALS } from '../../../store/setupWizardStore';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Availability'>;

const MEAL_LABELS: Record<(typeof WIZARD_MEALS)[number], string> = {
  breakfast: 'B',
  lunch: 'L',
  snack: 'S',
  dinner: 'D',
};

export default function WizardAvailabilityScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const members = useSetupWizardStore((s) => s.members);
  const ensureOwner = useSetupWizardStore((s) => s.ensureOwner);
  const setMemberAvailability = useSetupWizardStore((s) => s.setMemberAvailability);
  const copyAvailabilityFromOwner = useSetupWizardStore((s) => s.copyAvailabilityFromOwner);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    ensureOwner(currentUser?.fullName ?? 'Me');
  }, [currentUser?.fullName]);

  useEffect(() => {
    if (!selectedId && members.length > 0) setSelectedId(members[0].localId);
  }, [members, selectedId]);

  const selectedMember = members.find((m) => m.localId === selectedId) ?? null;
  const goNext = () => navigation.navigate('Pantry');

  return (
    <WizardShell step={6} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Weekly Availability</Text>
        <Text style={styles.body}>
          When will your family be eating at home? Toggle meals for each person so we can estimate
          portions accurately.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberTabs}>
          {members.map((m) => {
            const active = m.localId === selectedId;
            return (
              <Pressable
                key={m.localId}
                onPress={() => setSelectedId(m.localId)}
                style={[styles.memberTab, active && styles.memberTabActive]}
              >
                <Text style={active ? styles.memberTabTextActive : styles.memberTabText}>
                  {m.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedMember && !selectedMember.isOwner && (
          <Pressable
            onPress={() => copyAvailabilityFromOwner(selectedMember.localId)}
            style={styles.copyButton}
          >
            <MaterialIcons name="content-copy" size={16} color={colors.primary} />
            <Text style={styles.copyButtonText}>Same as mine</Text>
          </Pressable>
        )}

        {selectedMember && (
          <View style={styles.grid}>
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.gridDayCell, styles.gridHeaderText]}>Day</Text>
              {WIZARD_MEALS.map((meal) => (
                <Text key={meal} style={[styles.gridMealHeader, styles.gridHeaderText]}>
                  {MEAL_LABELS[meal]}
                </Text>
              ))}
            </View>
            {WIZARD_DAYS.map((day) => (
              <View key={day} style={styles.gridRow}>
                <Text style={styles.gridDayCell}>{day}</Text>
                {WIZARD_MEALS.map((meal) => {
                  const on = selectedMember.availability[day][meal];
                  return (
                    <View key={meal} style={styles.gridMealCell}>
                      <Pressable
                        onPress={() =>
                          setMemberAvailability(selectedMember.localId, day, meal, !on)
                        }
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
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue" onPress={goNext} />
      </View>
    </WizardShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  memberTabs: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  memberTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerHigh,
    marginRight: spacing.sm,
  },
  memberTabActive: {
    backgroundColor: colors.primaryContainer,
  },
  memberTabText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  memberTabTextActive: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.default,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  copyButtonText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  grid: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  gridHeaderText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  gridDayCell: {
    width: 56,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  gridMealCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridMealHeader: {
    flex: 1,
    textAlign: 'center',
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    padding: spacing.marginMobile,
  },
});
