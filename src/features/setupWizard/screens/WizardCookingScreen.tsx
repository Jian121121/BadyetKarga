import { View, Text, Image, ScrollView, Pressable, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useSetupWizardStore } from '../../../store/setupWizardStore';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Cooking'>;

const FREQUENCIES: Array<{
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { label: 'Everyday', icon: 'restaurant' },
  { label: 'Weekdays', icon: 'calendar-today' },
  { label: 'Weekends', icon: 'weekend' },
  { label: 'Occasionally', icon: 'auto-awesome' },
];

const COOK_TIMES = ['15 minutes', '30 minutes', '1 hour', 'Any'];

const MEAL_STYLES: Array<{
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  image: number;
}> = [
  {
    label: 'Budget Friendly',
    icon: 'account-balance-wallet',
    image: require('../../../../assets/wizard/meal-budget.png'),
  },
  {
    label: 'Healthy',
    icon: 'eco',
    image: require('../../../../assets/wizard/meal-healthy.png'),
  },
  {
    label: 'Traditional Filipino',
    icon: 'restaurant',
    image: require('../../../../assets/wizard/meal-filipino.png'),
  },
  {
    label: 'Quick Meals',
    icon: 'bolt',
    image: require('../../../../assets/wizard/meal-quick.png'),
  },
  {
    label: 'Mixed',
    icon: 'dashboard',
    image: require('../../../../assets/wizard/meal-mixed.png'),
  },
];

export default function WizardCookingScreen({ navigation }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 420);
  const cookFrequency = useSetupWizardStore((s) => s.cookFrequency);
  const preferredCookTime = useSetupWizardStore((s) => s.preferredCookTime);
  const mealStyles = useSetupWizardStore((s) => s.mealStyles);
  const setCookFrequency = useSetupWizardStore((s) => s.setCookFrequency);
  const setPreferredCookTime = useSetupWizardStore((s) => s.setPreferredCookTime);
  const toggleMealStyle = useSetupWizardStore((s) => s.toggleMealStyle);
  const [choiceModal, setChoiceModal] = useState<'frequency' | 'time' | null>(null);

  const goNext = () => navigation.navigate('Complete');

  return (
    <WizardShell step={8} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Almost there!</Text>
        <Text style={styles.body}>
          Tell us how you cook so we can plan weekly meals and grocery lists that fit your life.
        </Text>

        <Text style={styles.sectionTitle}>How often do you cook?</Text>
        <Pressable style={styles.selectField} onPress={() => setChoiceModal('frequency')}>
          <Text style={styles.selectValue}>{cookFrequency || 'Choose cooking frequency'}</Text>
          <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
        </Pressable>

        <Text style={styles.sectionTitle}>Preferred Cooking Time</Text>
        <Pressable style={styles.selectField} onPress={() => setChoiceModal('time')}>
          <Text style={styles.selectValue}>{preferredCookTime || 'Choose preferred time'}</Text>
          <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
        </Pressable>

        <Text style={styles.sectionTitle}>Meal Style</Text>
        {MEAL_STYLES.map((style) => {
          const selected = mealStyles.includes(style.label);
          return (
            <Pressable
              key={style.label}
              onPress={() => toggleMealStyle(style.label)}
              style={[styles.styleCard, selected && styles.styleCardSelected]}
            >
              <Image source={style.image} style={styles.styleImage} resizeMode="cover" />
              <View style={styles.styleOverlay}>
                <MaterialIcons name={style.icon} size={18} color="#fff" />
                <Text style={styles.styleLabel}>{style.label}</Text>
              </View>
              {selected && (
                <View style={styles.checkBadge}>
                  <MaterialIcons name="check" size={16} color={colors.onPrimary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continue" onPress={goNext} />
      </View>

      <Modal visible={choiceModal !== null} transparent animationType="fade" onRequestClose={() => setChoiceModal(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChoiceModal(null)} />
          <View style={[styles.choiceCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              Choose {choiceModal === 'frequency' ? 'cooking frequency' : 'preferred cooking time'}
            </Text>
            {(choiceModal === 'frequency' ? FREQUENCIES.map((item) => item.label) : COOK_TIMES).map((option) => {
              const selected = choiceModal === 'frequency' ? cookFrequency === option : preferredCookTime === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                  onPress={() => {
                    if (choiceModal === 'frequency') setCookFrequency(option);
                    else setPreferredCookTime(option);
                    setChoiceModal(null);
                  }}
                >
                  <Text style={selected ? styles.choiceTextSelected : styles.choiceText}>{option}</Text>
                  {selected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </View>
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
  sectionTitle: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  selectValue: { ...typography.bodyLg, color: colors.onSurface },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  choiceCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  modalTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.xs },
  choiceRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  choiceRowSelected: { backgroundColor: colors.primaryContainer },
  choiceText: { ...typography.bodyLg, color: colors.onSurface },
  choiceTextSelected: { ...typography.titleMd, color: colors.primary },
  freqCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  freqCardSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  freqText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurface,
  },
  freqTextSelected: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextSelected: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  styleCard: {
    height: 110,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    borderColor: colors.primary,
  },
  styleImage: {
    width: '100%',
    height: '100%',
  },
  styleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  styleLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: '#fff',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: spacing.marginMobile,
  },
});
