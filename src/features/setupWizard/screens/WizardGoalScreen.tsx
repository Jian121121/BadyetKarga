import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useSetupWizardStore } from '../../../store/setupWizardStore';
import { HOUSEHOLD_GOALS } from '../../../shared/constants/householdGoals';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Goal'>;

export default function WizardGoalScreen({ navigation }: Props) {
  const selectedGoals = useSetupWizardStore((s) => s.selectedGoals);
  const toggleGoal = useSetupWizardStore((s) => s.toggleGoal);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const handleGoalPress = (goal: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleGoal(goal);
  };

  const goNext = () => navigation.navigate('Family');

  return (
    <WizardShell step={3} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What are your household goals?</Text>
        <Text style={styles.body}>
          Select all that apply. BadyetKarga's meal engine will balance these objectives simultaneously.
        </Text>

        <View style={styles.summaryBar}>
          <MaterialIcons name="tune" size={18} color={colors.primary} />
          <Text style={styles.summaryText}>
            {selectedGoals.length} goal{selectedGoals.length === 1 ? '' : 's'} selected · Multi-Goal Optimization
          </Text>
        </View>

        <View style={styles.checklist}>
          {HOUSEHOLD_GOALS.map((item) => {
            const isSelected = selectedGoals.includes(item.label);
            return (
              <Pressable
                key={item.id}
                onPress={() => handleGoalPress(item.label)}
                style={[styles.goalRow, isSelected && styles.goalRowSelected]}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
                  ]}
                >
                  {isSelected && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
                </View>

                <View style={styles.iconWrap}>
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={isSelected ? colors.primary : colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.goalTextWrap}>
                  <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={styles.goalDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={`Continue with ${selectedGoals.length} Goal${selectedGoals.length === 1 ? '' : 's'} →`}
          onPress={goNext}
          disabled={selectedGoals.length === 0}
        />
        <Pressable onPress={goNext} style={styles.laterLink}>
          <Text style={styles.laterText}>I'll customize later</Text>
        </Pressable>
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
    marginBottom: spacing.sm,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onPrimaryContainer,
  },
  checklist: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  goalRowSelected: {
    backgroundColor: colors.primaryContainer,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxUnselected: {
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTextWrap: {
    flex: 1,
  },
  goalLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
  },
  goalLabelSelected: {
    color: colors.primary,
  },
  goalDescription: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  footer: {
    padding: spacing.marginMobile,
    gap: spacing.sm,
  },
  laterLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  laterText: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.primary,
  },
});
