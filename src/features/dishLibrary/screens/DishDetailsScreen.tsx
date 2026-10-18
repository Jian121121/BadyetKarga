import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useAuthStore } from '../../../store/authStore';
import {
  getIngredientsForDish,
  type DishIngredient,
} from '../../../services/database/dishIngredientRepository';
import { updateIngredientPrice, deleteCustomDish } from '../../../services/database/dishRepository';
import { imageForDish } from '../dishImages';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { isStrictDecimal } from '../../../shared/utils/validation';
import { useGroceryStore } from '../../../store/groceryStore';
import { decimalOnly } from '../../../shared/utils/validation';
import BackHeader from '../../../shared/components/BackHeader';
import { useHouseholdStore } from '../../../store/householdStore';
import { addMealException } from '../../../services/database/mealExceptionRepository';
import {
  isDishRestrictedByReligion,
  parseCustomFoodRestrictions,
  parseCustomFoodTerms,
  restrictionSourceLabel,
} from '../../../shared/constants/religion';
import { listOpenMealSlots } from '../../../shared/utils/week';
import EmptySlotPicker from '../components/EmptySlotPicker';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishDetails'>;

export default function DishDetailsScreen({ route, navigation }: Props) {
  const { dishId } = route.params;
  const fromPlanner = route.params.fromPlanner === true;
  const pickSlot = route.params.pickSlot === true;
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const religion = useHouseholdStore((s) => s.settings?.religion ?? 'No Religious Restriction');
  const {
    dishes,
    entries,
    eatersBySlot,
    loadDishes,
    planMeal,
    selectedDay,
    selectedMealType,
    setSelection,
    loadEntries,
  } = useMealPlanStore();
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [pickedOpenSlot, setPickedOpenSlot] = useState(!pickSlot);
  const regenerateGrocery = useGroceryStore((s) => s.regenerate);
  const [ingredients, setIngredients] = useState<DishIngredient[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dish = dishes.find((d) => String(d.id) === dishId);
  const isMine =
    !!dish?.isCustom && !!currentUser && dish.createdBy === currentUser.id;

  useEffect(() => {
    if (dishes.length === 0) loadDishes();
  }, []);

  useEffect(() => {
    if (dish) {
      getIngredientsForDish(dish.id).then(setIngredients);
    }
  }, [dish]);

  const openSlots = useMemo(
    () => listOpenMealSlots(entries, eatersBySlot),
    [entries, eatersBySlot]
  );
  const alreadyOnSelectedSlot = entries.some(
    (entry) =>
      String(entry.dishId) === dishId &&
      entry.dayOfWeek === selectedDay &&
      entry.mealType === selectedMealType
  );
  const viewOnly = fromPlanner || alreadyOnSelectedSlot;
  const selectedIsOpen = openSlots.some(
    (slot) => slot.day === selectedDay && slot.meal === selectedMealType
  );
  const canAddToSelected = !pickSlot || (pickedOpenSlot && selectedIsOpen);

  const addToSlot = async (day: string, meal: string) => {
    if (!currentUser || !dish) return;
    const storedRestrictions = useHouseholdStore.getState().settings?.customFoodRestrictions;
    if (
      isDishRestrictedByReligion(
        dish.name,
        dish.category,
        ingredients.map((item) => item.ingredientName),
        religion,
        parseCustomFoodRestrictions(storedRestrictions),
        parseCustomFoodTerms(storedRestrictions)
      )
    ) {
      confirmAction(
        'Food consideration warning',
        `${dish.name} is not recommended for ${restrictionSourceLabel(religion)}. Allow it for this household and add it anyway?`,
        'Allow and add',
        () => {
          void addMealException(currentUser.id, dish.id, dish.name, true, 'User chose this dish manually')
            .then(() => planMeal(currentUser.id, dish.id, day, meal))
            .then((result) => {
              if (!result.ok) notify('Cannot add dish', result.reason ?? 'Please pick another dish.');
              else navigation.navigate('MealPlanner');
            })
            .catch(() => notify('Could not allow dish', 'Please try again.'));
        }
      );
      return;
    }
    const result = await planMeal(currentUser.id, dish.id, day, meal);
    if (!result.ok) {
      notify('Cannot add dish', result.reason ?? 'Please pick another dish.');
      return;
    }
    navigation.navigate('MealPlanner');
  };

  const handleAddToPlan = async () => {
    if (!currentUser || !dish || viewOnly) return;
    if (!canAddToSelected) {
      if (openSlots.length === 0) {
        notify('No free days', 'Every available meal already has a dish. Remove one first.');
        return;
      }
      setSlotPickerOpen(true);
      return;
    }
    await addToSlot(selectedDay, selectedMealType);
  };

  const handleSavePrice = async (ingredient: DishIngredient) => {
    setEditingId(null);
    if (!isStrictDecimal(editValue)) return;
    await updateIngredientPrice(ingredient.id, Number(editValue));
    if (dish) {
      setIngredients(await getIngredientsForDish(dish.id));
      await loadDishes();
    }
  };

  const handleDeleteDish = () => {
    if (!currentUser || !dish || !isMine || deleting) return;
    setMenuOpen(false);
    // Let the menu Modal finish closing; iOS can't present the dialog Modal on top of it.
    setTimeout(() => confirmAction(
      'Delete this dish?',
      `Remove “${dish.name}” from your library? It will also leave any planned meals that used it.`,
      'Delete',
      () =>
        void (async () => {
          setDeleting(true);
          try {
            const ok = await deleteCustomDish(currentUser.id, dish.id);
            if (!ok) {
              notify('Could not delete', 'Only your personal dishes can be deleted.');
              return;
            }
            await loadDishes();
            await loadEntries(currentUser.id);
            await regenerateGrocery(currentUser.id);
            notify('Dish deleted', `${dish.name} was removed from your library.`, () =>
              navigation.goBack()
            );
          } finally {
            setDeleting(false);
          }
        })(),
      { destructive: true }
    ), 350);
  };

  if (!dish) {
    return (
      <View style={styles.root}>
        <BackHeader title="Dish Details" onBack={navigation.goBack} />
        <View style={styles.center}>
          <Text style={styles.empty}>Dish not found.</Text>
        </View>
      </View>
    );
  }

  const totalCost = ingredients.reduce((sum, i) => sum + i.estimatedPrice, 0);
  const tags = dish.tags.split(',').filter(Boolean);

  return (
    <View style={styles.root}>
      <BackHeader
        title="Dish Details"
        onBack={navigation.goBack}
        right={
          isMine ? (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} style={styles.headerMenuButton}>
              <MaterialIcons name="more-vert" size={22} color={colors.primary} />
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.heroWrap}>
          <Image source={imageForDish(dish.name, dish.category, dish.imageUri)} style={styles.hero} />
          <View style={styles.heroBadges}>
            {tags.slice(0, 2).map((tag, index) => (
              <View
                key={tag}
                style={[styles.heroBadge, index === 0 ? styles.heroBadgeGreen : styles.heroBadgeGold]}
              >
                <Text
                  style={index === 0 ? styles.heroBadgeTextGreen : styles.heroBadgeTextGold}
                  numberOfLines={1}
                >
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{dish.name}</Text>

          <View style={styles.statRow}>
            <View style={styles.statChip}>
              <MaterialIcons name="payments" size={18} color={colors.primary} />
              <View>
                <Text style={styles.statLabel}>COST</Text>
                <Text style={styles.statValue}>₱{Math.round(totalCost)}</Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <MaterialIcons name="group" size={18} color={colors.primary} />
              <View>
                <Text style={styles.statLabel}>SERVINGS</Text>
                <Text style={styles.statValue}>
                  {dish.servings} Pax
                </Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <MaterialIcons name="schedule" size={18} color={colors.primary} />
              <View>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValue}>{dish.prepTimeMinutes}m</Text>
              </View>
            </View>
          </View>

          {!!dish.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{dish.description}</Text>
            </>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{ingredients.length} Items</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            Estimated prices — tap a price to correct it for your area.
          </Text>

          {ingredients.map((item) => (
            <View key={item.id} style={styles.ingredientRow}>
              <View style={styles.ingredientIcon}>
                <MaterialIcons name="restaurant" size={16} color={colors.primary} />
              </View>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.ingredientName}</Text>
                <Text style={styles.ingredientQty}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              {editingId === item.id ? (
                <RNTextInput
                  value={editValue}
                  onChangeText={(v) => setEditValue(decimalOnly(v))}
                  keyboardType="numeric"
                  autoFocus
                  style={styles.priceInput}
                  onBlur={() => handleSavePrice(item)}
                  onSubmitEditing={() => handleSavePrice(item)}
                  returnKeyType="done"
                />
              ) : (
                <Pressable
                  onPress={() => {
                    setEditingId(item.id);
                    setEditValue(String(item.estimatedPrice));
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.ingredientPrice}>₱{item.estimatedPrice.toFixed(2)}</Text>
                </Pressable>
              )}
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Estimated Cost</Text>
            <Text style={styles.totalValue}>₱{totalCost.toFixed(2)}</Text>
          </View>

          {viewOnly ? (
            <View style={styles.plannedNote}>
              <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              <Text style={styles.plannedNoteText}>
                {fromPlanner
                  ? 'This dish is already on your plan. Review the ingredients here.'
                  : `Already planned for ${selectedDay} ${selectedMealType}.`}
              </Text>
            </View>
          ) : (
            <Button
              label={
                canAddToSelected
                  ? `Add to ${selectedDay} ${selectedMealType}`
                  : 'Add to a free day'
              }
              onPress={handleAddToPlan}
              style={styles.inlineAddButton}
            />
          )}
        </View>
      </ScrollView>

      <EmptySlotPicker
        visible={slotPickerOpen}
        slots={openSlots}
        selected={canAddToSelected ? { day: selectedDay, meal: selectedMealType } : null}
        onClose={() => setSlotPickerOpen(false)}
        onSelect={(day, meal) => {
          setSelection(day, meal);
          setPickedOpenSlot(true);
          setSlotPickerOpen(false);
          void addToSlot(day, meal);
        }}
      />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View
            style={[styles.menuSheet, { marginTop: insets.top + 56 }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.menuTitle}>My dish</Text>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate('AddDish', { dishId: dish.id });
              }}
            >
              <MaterialIcons name="edit" size={22} color={colors.primary} />
              <Text style={styles.menuCancelText}>Edit dish</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={handleDeleteDish}
              disabled={deleting}
            >
              <MaterialIcons name="delete-outline" size={22} color={colors.error} />
              <Text style={styles.menuDeleteText}>Delete dish</Text>
            </Pressable>
            <Pressable style={styles.menuRow} onPress={() => setMenuOpen(false)}>
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
              <Text style={styles.menuCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
  scroll: {
    paddingBottom: spacing.lg,
  },
  heroWrap: {
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: 240,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  menuButton: {
    position: 'absolute',
    right: spacing.marginMobile,
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: spacing.marginMobile,
    alignItems: 'flex-end',
  },
  menuSheet: {
    width: 220,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  menuTitle: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuDeleteText: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.error,
  },
  menuCancelText: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurfaceVariant,
  },
  heroBadges: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.marginMobile,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    maxWidth: 180,
  },
  heroBadgeGreen: {
    backgroundColor: colors.primary,
  },
  heroBadgeGold: {
    backgroundColor: colors.secondaryContainer,
  },
  heroBadgeTextGreen: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onPrimary,
  },
  heroBadgeTextGold: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onSecondaryContainer,
  },
  body: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
  },
  name: {
    ...typography.headlineLgMobile,
    fontSize: 28,
    lineHeight: 36,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statLabel: {
    ...typography.labelLg,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  statValue: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
  },
  sectionTitle: {
    ...typography.titleLg,
    fontSize: 20,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  countPill: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  countPillText: {
    ...typography.labelLg,
    fontSize: 11,
    color: colors.onPrimaryContainer,
  },
  disclaimer: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  ingredientIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  ingredientQty: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  ingredientPrice: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.secondary,
  },
  priceInput: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 72,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalLabel: {
    ...typography.titleMd,
    color: colors.onSurface,
  },
  totalValue: {
    ...typography.titleLg,
    color: colors.primary,
  },
  plannedNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.primaryContainer,
  },
  plannedNoteText: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onPrimaryContainer,
  },
  inlineAddButton: {
    height: 52,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
