import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import WizardShell from '../components/WizardShell';
import { useSetupWizardStore } from '../../../store/setupWizardStore';
import { ingredientKey } from '../../../shared/utils/ingredientKey';

type Props = NativeStackScreenProps<SetupWizardStackParamList, 'Pantry'>;

const COMMON_INGREDIENTS: Array<{
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { name: 'Rice', icon: 'rice-bowl' },
  { name: 'Salt', icon: 'water-drop' },
  { name: 'Pepper', icon: 'grain' },
  { name: 'Garlic', icon: 'eco' },
  { name: 'Onion', icon: 'spa' },
  { name: 'Soy Sauce', icon: 'local-drink' },
  { name: 'Vinegar', icon: 'opacity' },
  { name: 'Cooking Oil', icon: 'propane-tank' },
  { name: 'Sugar', icon: 'cake' },
  { name: 'Flour', icon: 'bakery-dining' },
  { name: 'Eggs', icon: 'egg-alt' },
  { name: 'Milk', icon: 'local-cafe' },
];

export default function WizardPantryScreen({ navigation }: Props) {
  const pantryItems = useSetupWizardStore((s) => s.pantryItems);
  const togglePantryItem = useSetupWizardStore((s) => s.togglePantryItem);

  const [customItem, setCustomItem] = useState('');
  const [query, setQuery] = useState('');

  const knownNames = COMMON_INGREDIENTS.map((i) => i.name);
  const customItems = pantryItems.filter((item) => !knownNames.includes(item));

  const filtered = COMMON_INGREDIENTS.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const addCustom = () => {
    const trimmed = customItem.trim();
    setCustomItem('');
    if (!trimmed) return;
    const key = ingredientKey(trimmed);
    if (pantryItems.some((item) => ingredientKey(item) === key)) return;
    const known = COMMON_INGREDIENTS.find((item) => ingredientKey(item.name) === key);
    togglePantryItem(known?.name ?? trimmed);
  };

  const goNext = () => navigation.navigate('Cooking');
  const clearSelection = () => {
    for (const item of pantryItems) togglePantryItem(item);
  };

  return (
    <WizardShell step={7} onBack={navigation.goBack} onSkip={goNext}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pantry Inventory</Text>
        <Text style={styles.body}>
          Let's see what's already in your kitchen to avoid double buying.
        </Text>

        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
          <RNTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search ingredients..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What ingredients do you already have?</Text>
          {pantryItems.length > 0 && (
            <Pressable onPress={clearSelection} hitSlop={8}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.grid}>
          {filtered.map((ingredient) => {
            const selected = pantryItems.includes(ingredient.name);
            return (
              <Pressable
                key={ingredient.name}
                onPress={() => togglePantryItem(ingredient.name)}
                style={[styles.ingredientCard, selected && styles.ingredientCardSelected]}
              >
                <MaterialIcons
                  name={ingredient.icon}
                  size={28}
                  color={selected ? colors.onPrimary : colors.primary}
                />
                <Text style={selected ? styles.ingredientTextSelected : styles.ingredientText}>
                  {ingredient.name}
                </Text>
              </Pressable>
            );
          })}
          {customItems.map((ingredient) => (
            <Pressable
              key={ingredient}
              onPress={() => togglePantryItem(ingredient)}
              style={[styles.ingredientCard, styles.ingredientCardSelected]}
            >
              <MaterialIcons name="check" size={28} color={colors.onPrimary} />
              <Text style={styles.ingredientTextSelected}>{ingredient}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.customLabel}>Add custom ingredient</Text>
        <View style={styles.customRow}>
          <RNTextInput
            value={customItem}
            onChangeText={setCustomItem}
            placeholder="e.g. Coconut milk"
            placeholderTextColor={colors.onSurfaceVariant}
            style={styles.customInput}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <Pressable onPress={addCustom} style={styles.customAddButton}>
            <MaterialIcons name="add" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>

        <Text style={styles.countLabel}>
          {pantryItems.length} item{pantryItems.length === 1 ? '' : 's'} selected
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Next Step" onPress={goNext} />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  sectionTitle: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  clearText: {
    ...typography.labelLg,
    color: colors.error,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ingredientCard: {
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
  ingredientCardSelected: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  ingredientText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurface,
  },
  ingredientTextSelected: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.primary,
  },
  customLabel: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  customInput: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    ...typography.bodyLg,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  customAddButton: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countLabel: {
    ...typography.labelLg,
    color: colors.primary,
  },
  footer: {
    padding: spacing.marginMobile,
  },
});
