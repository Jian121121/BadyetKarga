import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useAuthStore } from '../../../store/authStore';
import { useSetupWizardStore, draftBudgetBuffer } from '../../../store/setupWizardStore';
import { formatBudgetBufferSummary } from '../../../algorithms/budgetBufferCalculator';
import {
  FOOD_RESTRICTION_OPTIONS,
  usesCustomFoodRestrictions,
} from '../../../shared/constants/religion';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Complete'>;

function shortGoal(goal: string | null): string {
  if (!goal) return 'Save More';
  if (goal.startsWith('Save')) return 'Save More';
  if (goal.startsWith('Eat')) return 'Eat Healthier';
  if (goal.startsWith('Cook')) return 'Cook Faster';
  if (goal.startsWith('Reduce')) return 'Less Waste';
  return goal;
}

export default function WizardCompleteScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const householdName = useSetupWizardStore((s) => s.householdName);
  const weeklyBudget = useSetupWizardStore((s) => s.weeklyBudget);
  const goal = useSetupWizardStore((s) => s.goal);
  const selectedGoals = useSetupWizardStore((s) => s.selectedGoals);
  const visitorBufferServings = useSetupWizardStore((s) => s.visitorBufferServings);
  const members = useSetupWizardStore((s) => s.members);
  const pantryItems = useSetupWizardStore((s) => s.pantryItems);
  const religion = useSetupWizardStore((s) => s.religion);
  const customFoodRestrictions = useSetupWizardStore((s) => s.customFoodRestrictions);
  const customFoodTerms = useSetupWizardStore((s) => s.customFoodTerms);
  const isCommitting = useSetupWizardStore((s) => s.isCommitting);
  const commitError = useSetupWizardStore((s) => s.commitError);
  const commitWizard = useSetupWizardStore((s) => s.commitWizard);

  const familyCount = Math.max(members.length, 1);
  const budgetValue = parseFloat(weeklyBudget) || 0;
  const { bufferPercentage } = draftBudgetBuffer({
    weeklyBudget,
    selectedGoals,
    members,
    visitorBufferServings,
  });

  const avoided = usesCustomFoodRestrictions(religion)
    ? [
        ...FOOD_RESTRICTION_OPTIONS.filter((o) => customFoodRestrictions.includes(o.key)).map((o) => o.label),
        ...customFoodTerms,
      ]
    : [];
  const foodRulesSummary = usesCustomFoodRestrictions(religion)
    ? avoided.length > 0
      ? `${religion}: avoid ${avoided.join(', ')}`
      : `${religion}: no foods selected yet`
    : religion;

  const handleFinish = async () => {
    if (!currentUser || isCommitting) return;
    await commitWizard(currentUser.id);
  };

  const cards: Array<{
    icon: keyof typeof MaterialIcons.glyphMap;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    fullWidth?: boolean;
  }> = [
    {
      icon: 'group',
      iconBg: colors.primary,
      iconColor: colors.onPrimary,
      label: 'FAMILY',
      value: `${familyCount} Member${familyCount === 1 ? '' : 's'}`,
    },
    {
      icon: 'account-balance-wallet',
      iconBg: colors.secondary,
      iconColor: '#fff',
      label: 'BUDGET',
      value: `₱${budgetValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      icon: 'savings',
      iconBg: colors.primaryContainer,
      iconColor: colors.primary,
      label: 'BUFFER',
      value:
        budgetValue > 0
          ? formatBudgetBufferSummary(bufferPercentage, budgetValue, visitorBufferServings)
          : 'Add a weekly budget to reserve a buffer',
      fullWidth: true,
    },
    {
      icon: 'inventory-2',
      iconBg: '#2F5D3A',
      iconColor: '#fff',
      label: 'PANTRY',
      value: `${pantryItems.length} Item${pantryItems.length === 1 ? '' : 's'}`,
    },
    {
      icon: 'track-changes',
      iconBg: colors.primaryContainer,
      iconColor: colors.primary,
      label: selectedGoals.length > 1 ? 'GOALS' : 'GOAL',
      value:
        selectedGoals.length > 1
          ? `${shortGoal(selectedGoals[0] ?? goal)} +${selectedGoals.length - 1} more`
          : shortGoal(selectedGoals[0] ?? goal),
    },
    {
      icon: 'restaurant',
      iconBg: colors.secondaryContainer,
      iconColor: colors.onSecondaryContainer,
      label: 'FOOD RULES',
      value: foodRulesSummary,
      fullWidth: true,
    },
  ];

  return (
    <WizardShell step={9} onBack={navigation.goBack}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroStage}>
          <Image
            source={require('../../../../assets/wizard/wizard-complete.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.body}>
          BadyetKarga is ready to optimize{' '}
          {householdName.trim() || 'your household'} budget and meal planning.
        </Text>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View
              key={card.label}
              style={[styles.summaryCard, card.fullWidth && styles.summaryCardFull]}
            >
              <View style={[styles.iconCircle, { backgroundColor: card.iconBg }]}> 
                <MaterialIcons name={card.icon} size={22} color={card.iconColor} />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        {commitError && <Text style={styles.error}>{commitError}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Start Planning →" onPress={handleFinish} loading={isCommitting} />
        <Text style={styles.footerHint}>Transitioning to your personalized dashboard...</Text>
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
  heroStage: {
    height: 160,
    borderRadius: radii.xl * 2,
    backgroundColor: colors.primaryContainer,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...typography.headlineLgMobile,
    fontSize: 28,
    lineHeight: 36,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  summaryCardFull: {
    width: '100%',
    minWidth: 0,
    flexGrow: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.labelLg,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  cardValue: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.marginMobile,
    gap: spacing.sm,
  },
  footerHint: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
