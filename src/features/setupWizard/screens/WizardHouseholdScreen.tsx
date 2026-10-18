import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import WizardShell from '../components/WizardShell';
import { useSetupWizardStore, draftBudgetBuffer } from '../../../store/setupWizardStore';
import { decimalOnly, nameTextOnly } from '../../../shared/utils/validation';
import {
  RELIGION_OPTIONS,
  RELIGION_DESCRIPTIONS,
  usesCustomFoodRestrictions,
} from '../../../shared/constants/religion';
import FoodRestrictionPicker from '../../../shared/components/FoodRestrictionPicker';
import { VISITOR_BUFFER_OPTIONS } from '../../../shared/utils/householdServing';
import { formatBudgetBufferSummary } from '../../../algorithms/budgetBufferCalculator';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Household'>;

const BUDGET_SUGGESTIONS = [2000, 3000, 4500, 6000, 8000];

export default function WizardHouseholdScreen({ navigation }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 420);
  const {
    householdName,
    weeklyBudget,
    visitorBufferServings,
    selectedGoals,
    members,
    currency,
    setHouseholdName,
    setWeeklyBudget,
    setVisitorBufferServings,
    religion,
    setReligion,
    customFoodRestrictions,
    toggleCustomFoodRestriction,
    customFoodTerms,
    setCustomFoodTerms,
  } = useSetupWizardStore();

  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [religionModalOpen, setReligionModalOpen] = useState(false);
  const religionDescriptionOpacity = useRef(new Animated.Value(1)).current;

  const parsedBudget = parseFloat(weeklyBudget) || 0;
  const { bufferPercentage, bufferAmount } = draftBudgetBuffer({
    weeklyBudget,
    selectedGoals,
    members,
    visitorBufferServings,
  });
  const usableBudget = Math.max(0, parsedBudget - bufferAmount);

  useEffect(() => {
    religionDescriptionOpacity.setValue(0);
    Animated.timing(religionDescriptionOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [religion, religionDescriptionOpacity]);

  const goNext = () => navigation.navigate('Goal');

  const visitorLabel =
    VISITOR_BUFFER_OPTIONS.find((o) => o.value === visitorBufferServings)?.label ??
    `${visitorBufferServings} Extra Servings`;

  return (
    <WizardShell step={2} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroStage}>
          <Image
            source={require('../../../../assets/wizard/wizard-household.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Household Details</Text>
        <Text style={styles.body}>
          Tell us about your home to personalize your budget, serving volume, and meal planning.
        </Text>

        <TextInput
          label="Household Name"
          value={householdName}
          onChangeText={(v) => setHouseholdName(nameTextOnly(v))}
          placeholder="e.g., The Cruz Family"
        />

        <Text style={styles.sectionHeader}>Household Composition</Text>
        <View style={styles.cardBox}>
          <View style={styles.compositionNoteRow}>
            <MaterialIcons name="groups" size={22} color={colors.primary} />
            <Text style={styles.compositionNote}>
              Household size comes from your Family Members. Add each person with their age,
              preferences, and availability so meal servings stay accurate.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Unexpected Visitor Buffer</Text>
        <Text style={styles.fieldHint}>
          Cooks extra servings at lunch and dinner for relatives or guests who drop by, and
          sets aside a little more of your budget for them.
        </Text>
        <Pressable style={styles.dropdown} onPress={() => setVisitorModalOpen(true)}>
          <View style={styles.dropdownContent}>
            <MaterialIcons name="group-add" size={20} color={colors.primary} />
            <Text style={styles.dropdownText}>{visitorLabel}</Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.onSurfaceVariant} />
        </Pressable>

        <Text style={styles.sectionHeader}>Weekly Grocery Budget</Text>
        <Text style={styles.fieldHint}>Set the amount available for groceries each week.</Text>
        <TextInput
          label="Total Weekly Budget (₱)"
          value={weeklyBudget}
          onChangeText={(v) => setWeeklyBudget(decimalOnly(v))}
          keyboardType="numeric"
          placeholder="0.00"
        />
        <Pressable style={styles.suggestionTrigger} onPress={() => setBudgetModalOpen(true)}>
          <Text style={styles.suggestionTriggerText}>Choose a suggested budget</Text>
          <MaterialIcons name="expand-more" size={22} color={colors.primary} />
        </Pressable>

        {parsedBudget > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Automatic Budget Buffer</Text>
            <View style={styles.bufferSummaryRow}>
              <MaterialIcons name="savings" size={20} color={colors.primary} />
              <Text style={styles.bufferSummaryText}>
                {formatBudgetBufferSummary(bufferPercentage, parsedBudget, visitorBufferServings)}
              </Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownUsableLabel}>Usable Meal Planning Budget</Text>
              <Text style={styles.breakdownUsableValue}>₱{usableBudget.toFixed(2)}</Text>
            </View>
            <Text style={styles.breakdownProtectedNote}>
              Calculated automatically and updated when your budget, goals, or household change.
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeader}>Religion / Dietary Preference</Text>
        <Text style={styles.fieldHint}>
          This helps filter meals to suit your household's food considerations.
        </Text>
        <Pressable style={styles.dropdown} onPress={() => setReligionModalOpen(true)}>
          <View style={styles.dropdownContent}>
            <MaterialIcons name="restaurant" size={20} color={colors.primary} />
            <Text style={styles.dropdownText}>{religion}</Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Animated.View style={[styles.preferenceNote, { opacity: religionDescriptionOpacity }]}>
          <MaterialIcons name="check-circle-outline" size={18} color={colors.primary} />
          <View style={styles.preferenceNoteContent}>
            <Text style={styles.preferenceNoteTitle}>Applied to meal recommendations</Text>
            <Text style={styles.preferenceNoteText}>
              {RELIGION_DESCRIPTIONS[religion] ?? 'Configured household dietary preference.'}
            </Text>
          </View>
        </Animated.View>
        {usesCustomFoodRestrictions(religion) && (
          <FoodRestrictionPicker
            selected={customFoodRestrictions}
            onToggle={toggleCustomFoodRestriction}
            terms={customFoodTerms}
            onChangeTerms={setCustomFoodTerms}
          />
        )}

        <Text style={styles.fieldLabel}>Currency</Text>
        <View style={styles.currencyChip}>
          <MaterialIcons name="payments" size={18} color={colors.onPrimaryContainer} />
          <Text style={styles.currencyText}>{currency} · Philippine Peso</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue →" onPress={goNext} />
      </View>

      {/* Visitor Buffer Modal */}
      <Modal
        visible={visitorModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVisitorModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setVisitorModalOpen(false)}>
          <View style={[styles.modalCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Visitor / Extra Serving Buffer</Text>
            <Text style={styles.modalSubtitle}>
              How many extra servings should meals aim for in case guests arrive?
            </Text>
            {VISITOR_BUFFER_OPTIONS.map((opt) => {
              const selected = visitorBufferServings === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  style={[styles.modalOption, selected && styles.modalOptionSelected]}
                  onPress={() => {
                    setVisitorBufferServings(opt.value);
                    setVisitorModalOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={budgetModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBudgetModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBudgetModalOpen(false)}>
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Suggested weekly budget</Text>
            <Text style={styles.modalSubtitle}>Choose a starting point or enter your own amount above.</Text>
            {BUDGET_SUGGESTIONS.map((amount) => {
              const selected = parsedBudget === amount;
              return (
                <Pressable
                  key={amount}
                  style={[styles.listOption, selected && styles.listOptionSelected]}
                  onPress={() => {
                    setWeeklyBudget(String(amount));
                    setBudgetModalOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    ₱{amount.toLocaleString('en-PH')}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={religionModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReligionModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReligionModalOpen(false)}>
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Dietary preference</Text>
            <Text style={styles.modalSubtitle}>Select the household's primary consideration.</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {RELIGION_OPTIONS.map((option) => {
              const selected = religion === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.listOption, styles.religionOption, selected && styles.listOptionSelected]}
                  onPress={() => {
                    setReligion(option);
                    setReligionModalOpen(false);
                  }}
                >
                  <View style={styles.radioRow}>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {option}
                      </Text>
                      <Text style={styles.optionSubText}>{RELIGION_DESCRIPTIONS[option]}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </WizardShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  heroStage: {
    height: 140,
    borderRadius: radii.xl * 2,
    backgroundColor: colors.primaryContainer,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
  sectionHeader: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.titleMd,
    fontSize: 14,
    color: colors.onSurface,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardBox: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  compositionNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  compositionNote: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
  },
  totalBadge: {
    ...typography.labelLg,
    color: colors.primary,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  stepperControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  stepperLabel: {
    ...typography.bodyLg,
    fontSize: 14,
    color: colors.onSurface,
  },
  stepperActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  miniStepperBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
  },
  stepperDisabled: {
    opacity: 0.3,
  },
  stepperNumText: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.sm,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dropdownText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  suggestionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  suggestionTriggerText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  preferenceNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  preferenceNoteContent: {
    flex: 1,
    gap: 2,
  },
  preferenceNoteTitle: {
    ...typography.labelLg,
    color: colors.onPrimaryContainer,
  },
  preferenceNoteText: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onPrimaryContainer,
  },
  breakdownCard: {
    backgroundColor: '#f4f9f2',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: 6,
  },
  breakdownTitle: {
    ...typography.labelLg,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownHint: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bufferSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bufferSummaryText: {
    flex: 1,
    ...typography.bodyLg,
    fontSize: 15,
    color: colors.onSurface,
  },
  breakdownLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  breakdownValue: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
  },
  breakdownReserved: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.error,
  },
  breakdownTotal: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: 4,
  },
  breakdownUsableLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    flexShrink: 1,
  },
  breakdownUsableValue: {
    ...typography.headlineLgMobile,
    fontSize: 20,
    color: colors.primary,
  },
  breakdownProtectedNote: {
    ...typography.bodyMd,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    fontStyle: 'italic',
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  currencyText: {
    ...typography.labelLg,
    fontSize: 14,
    color: colors.onPrimaryContainer,
  },
  footer: {
    padding: spacing.marginMobile,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sheetCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.marginMobile,
    gap: spacing.xs,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  listOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  listOptionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  religionOption: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 0,
    borderRadius: radii.lg,
    marginBottom: 2,
  },
  optionCopy: { flex: 1 },
  optionSubText: {
    ...typography.bodyMd,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  modalTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  modalSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerLowest,
  },
  modalOptionSelected: {
    backgroundColor: colors.primaryContainer,
  },
  optionText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  optionTextSelected: {
    ...typography.titleMd,
    color: colors.primary,
  },
  customOptionBox: {
    gap: spacing.xs,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  applyBtn: {
    height: 48,
    minWidth: 90,
  },
});
