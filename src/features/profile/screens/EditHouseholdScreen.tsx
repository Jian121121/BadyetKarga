import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import { useAuthStore } from '../../../store/authStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { HOUSEHOLD_GOALS } from '../../../shared/constants/householdGoals';
import {
  RELIGION_OPTIONS,
  RELIGION_DESCRIPTIONS,
  parseCustomFoodRestrictions,
  parseCustomFoodTerms,
  serializeCustomFoodRestrictions,
  restrictionSourceLabel,
  usesCustomFoodRestrictions,
  type FoodRestrictionKey,
} from '../../../shared/constants/religion';
import FoodRestrictionPicker from '../../../shared/components/FoodRestrictionPicker';
import {
  VISITOR_BUFFER_OPTIONS,
  compositionFromMembers,
  type HouseholdComposition,
} from '../../../shared/utils/householdServing';
import {
  calculateBudgetBuffer,
  formatBudgetBufferSummary,
} from '../../../algorithms/budgetBufferCalculator';
import {
  getMealExceptions,
  addMealException,
  removeMealException,
  type MealException,
} from '../../../services/database/mealExceptionRepository';
import { getAllDishes, type Dish } from '../../../services/database/dishRepository';
import { getFamilyMembers } from '../../../services/database/familyRepository';
import { notify, confirmAction } from '../../../shared/utils/confirm';
import { decimalOnly } from '../../../shared/utils/validation';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import BackHeader from '../../../shared/components/BackHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditHousehold'>;

const BUDGET_PRESETS = [2000, 3000, 4500, 6000, 8000];

function parseBudget(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export default function EditHouseholdScreen({ navigation }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 420);
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const saveSettings = useHouseholdStore((s) => s.saveSettings);

  const [householdName, setHouseholdName] = useState(settings?.householdName ?? '');
  const [weeklyBudget, setWeeklyBudget] = useState(
    settings?.weeklyBudget != null && settings.weeklyBudget > 0
      ? String(settings.weeklyBudget)
      : ''
  );
  const [visitorBufferServings, setVisitorBufferServings] = useState(
    settings?.visitorBufferServings ?? 0
  );
  const [religion, setReligion] = useState(settings?.religion ?? 'No Religious Restriction');
  const [customFoodRestrictions, setCustomFoodRestrictions] = useState<FoodRestrictionKey[]>(
    parseCustomFoodRestrictions(settings?.customFoodRestrictions)
  );
  const [customFoodTerms, setCustomFoodTerms] = useState<string[]>(
    parseCustomFoodTerms(settings?.customFoodRestrictions)
  );
  const toggleCustomFoodRestriction = (key: FoodRestrictionKey) =>
    setCustomFoodRestrictions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  // Goals (multi-select)
  const initialGoals = (() => {
    if (settings?.selectedGoals) {
      try {
        const parsed = JSON.parse(settings.selectedGoals);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return [settings?.householdGoal || 'Save Money'];
  })();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initialGoals);

  // Exceptions & Dishes
  const [exceptions, setExceptions] = useState<MealException[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [addExceptionOpen, setAddExceptionOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [selectedDishForException, setSelectedDishForException] = useState<Dish | null>(null);

  // Modals
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [religionModalOpen, setReligionModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [composition, setComposition] = useState<HouseholdComposition | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    void getMealExceptions(currentUser.id).then(setExceptions);
    void getAllDishes(currentUser.id).then(setDishes);
    void getFamilyMembers(currentUser.id).then((members) =>
      setComposition(compositionFromMembers(members))
    );
  }, [currentUser?.id]);

  useEffect(() => {
    if (!settings) return;
    setHouseholdName(settings.householdName);
    setWeeklyBudget(settings.weeklyBudget > 0 ? String(settings.weeklyBudget) : '');
    setVisitorBufferServings(settings.visitorBufferServings ?? 0);
    setReligion(settings.religion ?? 'No Religious Restriction');
    setCustomFoodRestrictions(parseCustomFoodRestrictions(settings.customFoodRestrictions));
    setCustomFoodTerms(parseCustomFoodTerms(settings.customFoodRestrictions));
    if (settings.selectedGoals) {
      try {
        const parsed = JSON.parse(settings.selectedGoals);
        if (Array.isArray(parsed)) setSelectedGoals(parsed);
      } catch {
        setSelectedGoals([settings.householdGoal || 'Save Money']);
      }
    }
  }, [settings?.userId]);

  const parsedBudget = parseBudget(weeklyBudget) ?? 0;
  const { bufferPercentage, bufferAmount } = calculateBudgetBuffer({
    weeklyBudget: parsedBudget,
    selectedGoals,
    adults: composition?.adults ?? settings?.adults ?? 1,
    children: composition?.children ?? settings?.children ?? 0,
    seniors: composition?.seniors ?? settings?.seniors ?? 0,
    infantsToddlers: composition?.infantsToddlers ?? settings?.infantsToddlers ?? 0,
    visitorBufferServings,
  });
  const usableBudget = Math.max(0, parsedBudget - bufferAmount);
  const selectedPreset =
    parsedBudget > 0 && BUDGET_PRESETS.includes(Math.round(parsedBudget))
      ? Math.round(parsedBudget)
      : null;

  const toggleGoal = (goalLabel: string) => {
    setSelectedGoals((prev) => {
      const exists = prev.includes(goalLabel);
      if (exists) {
        const next = prev.filter((g) => g !== goalLabel);
        return next.length > 0 ? next : ['Save Money'];
      }
      return [...prev, goalLabel];
    });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    const budget = parseBudget(weeklyBudget);
    if (budget === null) {
      setBudgetError('Enter a valid weekly budget (₱0 or more).');
      return;
    }
    setBudgetError(null);
    setSaving(true);
    try {
      const latest = compositionFromMembers(await getFamilyMembers(currentUser.id));
      await saveSettings({
        userId: currentUser.id,
        householdName: householdName.trim() || settings?.householdName || 'My Household',
        weeklyBudget: budget,
        householdGoal: selectedGoals[0] || 'Save Money',
        currency: settings?.currency ?? 'PHP',
        cookFrequency: settings?.cookFrequency ?? '',
        preferredCookTime: settings?.preferredCookTime ?? '',
        mealStyles: settings?.mealStyles ?? '[]',
        totalMembers: Math.max(1, latest.totalMembers),
        adults: latest.adults,
        children: latest.children,
        seniors: latest.seniors,
        infantsToddlers: latest.infantsToddlers,
        visitorBufferServings,
        religion,
        customFoodRestrictions: usesCustomFoodRestrictions(religion)
          ? serializeCustomFoodRestrictions(customFoodRestrictions, customFoodTerms)
          : serializeCustomFoodRestrictions([], []),
        selectedGoals: JSON.stringify(selectedGoals),
        planDurationDays: settings?.planDurationDays ?? 7,
      });
      if (useMealPlanStore.getState().entries.length > 0) {
        await useMealPlanStore.getState().generateWeek(currentUser.id);
      }

      notify(
        'Household settings updated',
        `Budget and preferences saved. Planner will use ₱${usableBudget.toLocaleString('en-PH')} usable budget and balance your ${selectedGoals.length} selected goals.`,
        () => navigation.goBack()
      );
    } catch {
      notify('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!currentUser || !selectedDishForException) return;
    const saved = await addMealException(
      currentUser.id,
      selectedDishForException.id,
      selectedDishForException.name,
      true,
      exceptionReason.trim() || 'Household favorite exception'
    );
    setExceptions((prev) => [...prev.filter((e) => e.dishId !== saved.dishId), saved]);
    setSelectedDishForException(null);
    setExceptionReason('');
    setAddExceptionOpen(false);
    if (useMealPlanStore.getState().entries.length > 0) {
      await useMealPlanStore.getState().generateWeek(currentUser.id);
    }
    notify('Meal exception added', `${saved.dishName} is now allowed in meal recommendations.`);
  };

  const handleRemoveException = (dishId: number, dishName: string) => {
    if (!currentUser) return;
    confirmAction(
      'Remove exception?',
      `Remove ${dishName} from your exceptions list? Rules from ${restrictionSourceLabel(religion)} will apply again.`,
      'Remove',
      async () => {
        await removeMealException(currentUser.id, dishId);
        setExceptions((prev) => prev.filter((e) => e.dishId !== dishId));
        if (useMealPlanStore.getState().entries.length > 0) {
          await useMealPlanStore.getState().generateWeek(currentUser.id);
        }
      },
      { destructive: true }
    );
  };

  const visitorLabel =
    VISITOR_BUFFER_OPTIONS.find((o) => o.value === visitorBufferServings)?.label ??
    `${visitorBufferServings} Extra Servings`;

  return (
    <View style={styles.root}>
      <BackHeader title="Edit Household" onBack={navigation.goBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Edit Household</Text>
        <Text style={styles.body}>
          Configure your household setup, multiple goals, budget buffers, and dietary preferences.
        </Text>

        {/* SECTION 1: Household Name */}
        <TextInput
          label="Household Name"
          value={householdName}
          onChangeText={setHouseholdName}
          placeholder="e.g. Cruz Family"
        />

        {/* SECTION 2: Demographic Composition */}
        <Text style={styles.sectionHeader}>Household Composition</Text>
        <View style={styles.compositionNoteBox}>
          <MaterialIcons name="groups" size={22} color={colors.primary} />
          <Text style={styles.compositionNoteText}>
            Family Members determines household size and serving needs. Update people, ages, and
            availability in Family Management.
          </Text>
        </View>

        {/* SECTION 3: Visitor Buffer */}
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

        {/* SECTION 4: Weekly Budget & Buffer */}
        <Text style={styles.sectionHeader}>Weekly Grocery Budget</Text>
        <TextInput
          label="Total Weekly Budget (₱)"
          value={weeklyBudget}
          onChangeText={(v) => {
            setWeeklyBudget(decimalOnly(v));
            setBudgetError(null);
          }}
          keyboardType="numeric"
          placeholder="e.g. 3500"
        />
        <Pressable style={styles.suggestionTrigger} onPress={() => setBudgetModalOpen(true)}>
          <Text style={styles.suggestionTriggerText}>Choose a suggested budget</Text>
          <MaterialIcons name="expand-more" size={22} color={colors.primary} />
        </Pressable>
        {budgetError ? <Text style={styles.error}>{budgetError}</Text> : null}

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
          </View>
        )}

        {/* SECTION 5: Multi-Goals */}
        <Text style={styles.sectionHeader}>Household Goals (Multi-Select)</Text>
        <Text style={styles.fieldHint}>
          Select all objectives you want the meal generator to balance together.
        </Text>
        <View style={styles.goalList}>
          {HOUSEHOLD_GOALS.map((g) => {
            const isSelected = selectedGoals.includes(g.label);
            return (
              <Pressable
                key={g.id}
                style={[styles.goalRow, isSelected && styles.goalRowSelected]}
                onPress={() => toggleGoal(g.label)}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                  ]}
                >
                  {isSelected && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
                </View>
                <MaterialIcons
                  name={g.icon}
                  size={20}
                  color={isSelected ? colors.primary : colors.onSurfaceVariant}
                />
                <View style={styles.goalText}>
                  <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                    {g.label}
                  </Text>
                  <Text style={styles.goalDesc}>{g.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* SECTION 6: Religion / Dietary Preference */}
        <Text style={styles.sectionHeader}>Religion / Food Considerations</Text>
        <Text style={styles.fieldHint}>
          Influences automatic meal planning recommendations.
        </Text>
        <Pressable style={styles.dropdown} onPress={() => setReligionModalOpen(true)}>
          <View style={styles.dropdownContent}>
            <MaterialIcons name="local-dining" size={20} color={colors.primary} />
            <Text style={styles.dropdownText}>{religion}</Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.religionDesc}>
          {RELIGION_DESCRIPTIONS[religion] ?? 'Configured household dietary preference.'}
        </Text>
        {usesCustomFoodRestrictions(religion) && (
          <FoodRestrictionPicker
            selected={customFoodRestrictions}
            onToggle={toggleCustomFoodRestriction}
            terms={customFoodTerms}
            onChangeTerms={setCustomFoodTerms}
          />
        )}

        {/* SECTION 7: Specific Meal Exceptions */}
        <View style={styles.exceptionHeaderRow}>
          <Text style={styles.sectionHeader}>Specific Meal Exceptions</Text>
          <Pressable
            style={styles.addExceptionBtn}
            onPress={() => setAddExceptionOpen(true)}
            hitSlop={8}
          >
            <MaterialIcons name="add" size={18} color={colors.primary} />
            <Text style={styles.addExceptionText}>Add Exception</Text>
          </Pressable>
        </View>
        <Text style={styles.fieldHint}>
          Allow specific dishes that would normally be restricted under your religion preference (e.g. allowing Dinuguan).
        </Text>

        {exceptions.length === 0 ? (
          <View style={styles.emptyExceptionBox}>
            <Text style={styles.emptyExceptionText}>No meal exceptions added.</Text>
          </View>
        ) : (
          <View style={styles.exceptionList}>
            {exceptions.map((exc) => (
              <View key={exc.dishId} style={styles.exceptionCard}>
                <View style={styles.exceptionInfo}>
                  <Text style={styles.exceptionDishName}>{exc.dishName}</Text>
                  <Text style={styles.exceptionBadge}>Allowed for this household</Text>
                  {!!exc.reason && <Text style={styles.exceptionReason}>Note: {exc.reason}</Text>}
                </View>
                <Pressable
                  onPress={() => handleRemoveException(exc.dishId, exc.dishName)}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Button label="Save Changes" onPress={handleSave} loading={saving} style={styles.saveBtn} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Visitor Modal */}
      <Modal visible={visitorModalOpen} transparent animationType="fade" onRequestClose={() => setVisitorModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setVisitorModalOpen(false)}>
          <View style={[styles.modalCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Visitor / Extra Serving Buffer</Text>
            <Text style={styles.modalSubtitle}>
              How many extra servings should meals aim for in case guests arrive?
            </Text>
            {VISITOR_BUFFER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.label}
                style={[styles.modalOption, visitorBufferServings === opt.value && styles.modalOptionSelected]}
                onPress={() => {
                  setVisitorBufferServings(opt.value);
                  setVisitorModalOpen(false);
                }}
              >
                <Text style={visitorBufferServings === opt.value ? styles.optionTextSelected : styles.optionText}>
                  {opt.label}
                </Text>
                {visitorBufferServings === opt.value && <MaterialIcons name="check" size={20} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={budgetModalOpen} transparent animationType="slide" onRequestClose={() => setBudgetModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setBudgetModalOpen(false)}>
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Suggested weekly budget</Text>
            <Text style={styles.modalSubtitle}>Choose a starting point or enter a custom amount above.</Text>
            {BUDGET_PRESETS.map((amount) => {
              const selected = selectedPreset === amount;
              return (
                <Pressable
                  key={amount}
                  style={[styles.listOption, selected && styles.listOptionSelected]}
                  onPress={() => {
                    setWeeklyBudget(String(amount));
                    setBudgetError(null);
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

      {/* Religion Modal */}
      <Modal visible={religionModalOpen} transparent animationType="slide" onRequestClose={() => setReligionModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReligionModalOpen(false)} />
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Dietary preference</Text>
            <Text style={styles.modalSubtitle}>Select the household's primary consideration.</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {RELIGION_OPTIONS.map((r) => {
                const selected = religion === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.pickOption, selected && styles.pickOptionSelected]}
                    onPress={() => {
                      setReligion(r);
                      setReligionModalOpen(false);
                    }}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{r}</Text>
                      <Text style={styles.optionSubText}>{RELIGION_DESCRIPTIONS[r]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Exception Modal */}
      <Modal visible={addExceptionOpen} transparent animationType="slide" onRequestClose={() => setAddExceptionOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddExceptionOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.exceptionKeyboardView}
          >
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Add dish exception</Text>
            <Text style={styles.modalSubtitle}>
              Pick a dish to always allow in recommendations, even if your food rules would filter it out.
            </Text>

            <ScrollView style={styles.dishPickList} bounces={false} showsVerticalScrollIndicator={false}>
              {dishes.map((dish) => {
                const selected = selectedDishForException?.id === dish.id;
                return (
                  <Pressable
                    key={dish.id}
                    style={[styles.pickOption, selected && styles.pickOptionSelected]}
                    onPress={() => setSelectedDishForException(dish)}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[styles.optionText, styles.dishPickName, selected && styles.optionTextSelected]}
                      numberOfLines={1}
                    >
                      {dish.name}
                    </Text>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{dish.category}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <TextInput
              label="Reason / Optional Note"
              value={exceptionReason}
              onChangeText={setExceptionReason}
              placeholder="e.g., Family traditional favorite"
              multiline
              maxLength={120}
              textAlignVertical="top"
              style={styles.exceptionReasonInput}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Button
                label="Cancel"
                variant="outlined"
                onPress={() => setAddExceptionOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Allow Dish"
                onPress={handleAddException}
                disabled={!selectedDishForException}
                style={{ flex: 1 }}
              />
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.marginMobile },
  title: { ...typography.headlineLgMobile, color: colors.onSurface },
  body: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
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
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
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
  compositionNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  compositionNoteText: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onPrimaryContainer,
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
  totalLabel: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
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
  stepperLabel: { ...typography.bodyLg, fontSize: 14, color: colors.onSurface },
  stepperActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  stepperDisabled: { opacity: 0.3 },
  stepperNumText: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
    minWidth: 24,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: { ...typography.labelLg, fontSize: 13, color: colors.onSurfaceVariant },
  presetTextSelected: { ...typography.labelLg, fontSize: 13, color: colors.onPrimary },
  suggestionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  suggestionTriggerText: { ...typography.labelLg, color: colors.primary },
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
  dropdownContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dropdownText: { ...typography.bodyLg, color: colors.onSurface },
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
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bufferSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bufferSummaryText: { flex: 1, ...typography.bodyLg, fontSize: 15, color: colors.onSurface },
  breakdownLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  breakdownValue: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
  breakdownReserved: { ...typography.titleMd, fontSize: 15, color: colors.error },
  breakdownTotal: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    marginTop: 4,
  },
  breakdownUsableLabel: { ...typography.titleMd, fontSize: 15, color: colors.onSurface, flexShrink: 1 },
  breakdownUsableValue: { ...typography.headlineLgMobile, fontSize: 20, color: colors.primary },
  goalList: { gap: spacing.xs },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  goalRowSelected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary },
  checkboxUnselected: { borderWidth: 2, borderColor: colors.outlineVariant },
  goalText: { flex: 1 },
  goalLabel: { ...typography.titleMd, fontSize: 14, color: colors.onSurface },
  goalLabelSelected: { color: colors.primary },
  goalDesc: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 1 },
  religionDesc: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  exceptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  addExceptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addExceptionText: { ...typography.labelLg, color: colors.primary },
  emptyExceptionBox: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyExceptionText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13 },
  exceptionList: { gap: spacing.xs, marginBottom: spacing.sm },
  exceptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  exceptionInfo: { flex: 1 },
  exceptionDishName: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
  exceptionBadge: { ...typography.labelLg, fontSize: 11, color: colors.primary, marginTop: 2 },
  exceptionReason: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  saveBtn: { marginTop: spacing.lg },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  modalCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
    maxHeight: '90%',
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
  listOptionSelected: { backgroundColor: colors.primaryContainer },
  exceptionKeyboardView: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exceptionReasonInput: {
    minHeight: 72,
    paddingTop: spacing.md,
  },
  modalTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 13, marginBottom: spacing.sm },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  modalOptionSelected: { backgroundColor: colors.primaryContainer },
  optionCopy: { flex: 1, paddingRight: spacing.sm },
  optionText: { ...typography.bodyLg, color: colors.onSurface },
  optionTextSelected: { ...typography.titleMd, color: colors.primary },
  optionSubText: { ...typography.bodyMd, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  applyBtn: { height: 48, minWidth: 90 },
  pickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: 2,
  },
  pickOptionSelected: { backgroundColor: colors.primaryContainer },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: radii.full, backgroundColor: colors.primary },
  dishPickList: { maxHeight: 240, marginVertical: spacing.xs },
  dishPickName: { flex: 1 },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
  },
  categoryChipText: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
});
