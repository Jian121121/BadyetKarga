import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../theme';
import {
  FOOD_RESTRICTION_OPTIONS,
  splitFoodTerms,
  type FoodRestrictionKey,
} from '../constants/religion';

interface Props {
  selected: FoodRestrictionKey[];
  onToggle: (key: FoodRestrictionKey) => void;
  /** Foods the household typed themselves (lowercase). */
  terms: string[];
  onChangeTerms: (terms: string[]) => void;
}

/** Foods the household avoids ("Other" / "Custom" religion): presets + free-typed foods. */
export default function FoodRestrictionPicker({ selected, onToggle, terms, onChangeTerms }: Props) {
  const [draft, setDraft] = useState('');

  const addDraft = () => {
    const added = splitFoodTerms(draft);
    setDraft('');
    if (added.length === 0) return;
    onChangeTerms([...terms, ...added.filter((t) => !terms.includes(t))]);
  };

  const nothingChosen = selected.length === 0 && terms.length === 0;

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Foods to avoid</Text>
      <Text style={styles.subtitle}>
        Meals containing these are left out of Auto-Plan and flagged in the Dish Library.
      </Text>
      {FOOD_RESTRICTION_OPTIONS.map((opt) => {
        const isOn = selected.includes(opt.key);
        return (
          <Pressable
            key={opt.key}
            style={[styles.row, isOn && styles.rowOn]}
            onPress={() => onToggle(opt.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
          >
            <MaterialIcons
              name={isOn ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={isOn ? colors.primary : colors.outline}
            />
            <View style={styles.rowText}>
              <Text style={styles.label}>{opt.label}</Text>
              <Text style={styles.hint} numberOfLines={2}>
                {opt.hint}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.title, styles.typeTitle]}>Add your own</Text>
      <Text style={styles.subtitle}>
        Type any food or ingredient (e.g. mushroom, peanut, ampalaya). Separate several with commas.
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addDraft}
          onBlur={addDraft}
          placeholder="e.g. mushroom, peanut"
          placeholderTextColor={colors.outline}
          style={styles.input}
          returnKeyType="done"
          autoCapitalize="none"
          maxLength={120}
          accessibilityLabel="Type a food to avoid"
        />
        <Pressable
          onPress={addDraft}
          style={[styles.addBtn, !draft.trim() && styles.addBtnDisabled]}
          disabled={!draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Add food to avoid"
        >
          <MaterialIcons name="add" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
      {terms.length > 0 && (
        <View style={styles.chips}>
          {terms.map((term) => (
            <Pressable
              key={term}
              style={styles.chip}
              onPress={() => onChangeTerms(terms.filter((t) => t !== term))}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${term}`}
              hitSlop={4}
            >
              <Text style={styles.chipText}>{term}</Text>
              <MaterialIcons name="close" size={14} color={colors.onPrimaryContainer} />
            </Pressable>
          ))}
        </View>
      )}

      {nothingChosen && (
        <Text style={styles.empty}>Nothing selected yet, so no foods are filtered.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    paddingLeft: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  title: { ...typography.labelLg, color: colors.onSurface },
  typeTitle: { marginTop: spacing.sm },
  subtitle: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    minHeight: 48,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  rowText: { flex: 1, minWidth: 0 },
  label: { ...typography.labelLg, color: colors.onSurface },
  hint: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
    ...typography.bodyMd,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: { ...typography.labelLg, fontSize: 12, color: colors.onPrimaryContainer },
  empty: { ...typography.bodyMd, fontSize: 12, color: colors.secondary, marginTop: spacing.xs },
});
