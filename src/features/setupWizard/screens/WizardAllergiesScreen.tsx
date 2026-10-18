import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useAuthStore } from '../../../store/authStore';
import { useSetupWizardStore } from '../../../store/setupWizardStore';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Allergies'>;

const ALLERGIES = [
  'Shrimp',
  'Crab',
  'Shellfish',
  'Milk',
  'Egg',
  'Peanut',
  'Soy',
  'Gluten',
  'Fish',
];
const DIETS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Low Sodium',
  'Low Sugar',
  'Diabetic Friendly',
];

export default function WizardAllergiesScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const members = useSetupWizardStore((s) => s.members);
  const ensureOwner = useSetupWizardStore((s) => s.ensureOwner);
  const toggleMemberAllergy = useSetupWizardStore((s) => s.toggleMemberAllergy);
  const toggleMemberDiet = useSetupWizardStore((s) => s.toggleMemberDiet);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    ensureOwner(currentUser?.fullName ?? 'Me');
  }, [currentUser?.fullName]);

  useEffect(() => {
    if (!selectedId && members.length > 0) setSelectedId(members[0].localId);
  }, [members, selectedId]);

  const selectedMember = members.find((m) => m.localId === selectedId) ?? null;
  const goNext = () => navigation.navigate('Availability');

  return (
    <WizardShell step={5} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Allergies & Preferences</Text>
        <Text style={styles.body}>
          Tell us what to keep off the menu for each household member.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberTabs}>
          {members.map((m) => {
            const active = m.localId === selectedId;
            const flagCount = m.allergies.length + m.dietaryRestrictions.length;
            return (
              <Pressable
                key={m.localId}
                onPress={() => setSelectedId(m.localId)}
                style={[styles.memberTab, active && styles.memberTabActive]}
              >
                <Text style={active ? styles.memberTabTextActive : styles.memberTabText}>
                  {m.name}
                  {flagCount > 0 ? ` (${flagCount})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedMember && (
          <>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning-amber" size={18} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Major Allergies</Text>
            </View>
            <View style={styles.optionList}>
              {ALLERGIES.map((allergy) => {
                const selected = selectedMember.allergies.includes(allergy);
                return (
                  <Pressable
                    key={allergy}
                    onPress={() => toggleMemberAllergy(selectedMember.localId, allergy)}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                  >
                    <Text style={selected ? styles.optionTextSelected : styles.optionText}>{allergy}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <MaterialIcons name="restaurant" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Dietary Lifestyles</Text>
            </View>
            <View style={styles.optionList}>
              {DIETS.map((diet) => {
                const selected = selectedMember.dietaryRestrictions.includes(diet);
                return (
                  <Pressable
                    key={diet}
                    onPress={() => toggleMemberDiet(selectedMember.localId, diet)}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                  >
                    <Text style={selected ? styles.optionTextSelected : styles.optionText}>{diet}</Text>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={18} color="#8B6914" />
          <Text style={styles.infoText}>
            Smart Guard Active: BadyetKarga will automatically avoid recommending meals containing
            restricted ingredients.
          </Text>
        </View>
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
    marginBottom: spacing.md,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
  },
  optionList: {
    marginBottom: spacing.md,
  },
  optionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  optionRowSelected: {
    backgroundColor: colors.primaryContainer,
  },
  optionText: {
    ...typography.labelLg,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  optionTextSelected: {
    ...typography.labelLg,
    fontSize: 14,
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  footer: {
    padding: spacing.marginMobile,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.secondaryFixed,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
});
