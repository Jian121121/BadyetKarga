import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';

interface QuickActionsProps {
  onPlanMeals: () => void;
  onGenerateGroceryList: () => void;
  onShoppingMode: () => void;
  generating?: boolean;
}

export default function QuickActions({
  onPlanMeals,
  onGenerateGroceryList,
  onShoppingMode,
  generating = false,
}: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onPlanMeals} style={[styles.button, styles.planButton]}>
        <MaterialIcons name="restaurant" size={22} color={colors.onPrimary} />
        <Text style={styles.planLabel}>Plan Meals</Text>
      </Pressable>

      <Pressable
        onPress={onGenerateGroceryList}
        disabled={generating}
        style={[styles.button, styles.groceryButton, generating && styles.disabled]}
      >
        {generating ? (
          <ActivityIndicator color={colors.onSecondaryContainer} />
        ) : (
          <>
            <MaterialIcons name="playlist-add-check" size={22} color={colors.onSecondaryContainer} />
            <Text style={styles.groceryLabel}>Generate Grocery List</Text>
          </>
        )}
      </Pressable>

      <Pressable onPress={onShoppingMode} style={[styles.button, styles.shopButton]}>
        <MaterialIcons name="shopping-cart" size={22} color={colors.primary} />
        <Text style={styles.shopLabel}>Shopping Mode</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  button: {
    height: 56,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  planButton: {
    backgroundColor: colors.primary,
  },
  planLabel: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onPrimary,
  },
  groceryButton: {
    backgroundColor: colors.secondaryContainer,
  },
  groceryLabel: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.onSecondaryContainer,
  },
  shopButton: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  shopLabel: {
    ...typography.titleMd,
    fontSize: 16,
    color: colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
