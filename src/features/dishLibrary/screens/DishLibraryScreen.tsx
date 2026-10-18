import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import { useAppDimensions } from '../../../shared/utils/appDimensions';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useAuthStore } from '../../../store/authStore';
import { useFamilyStore } from '../../../store/familyStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { getIngredientsForDishes } from '../../../services/database/dishIngredientRepository';
import { deleteCustomDish, type Dish } from '../../../services/database/dishRepository';
import { collectAllergies, filterDishesByAllergies } from '../../../algorithms/allergyFilter';
import { imageForDish, DISH_CATEGORIES } from '../dishImages';
import { listOpenMealSlots } from '../../../shared/utils/week';
import EmptySlotPicker from '../components/EmptySlotPicker';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import BackHeader from '../../../shared/components/BackHeader';
import { useHouseholdStore } from '../../../store/householdStore';
import { addMealException } from '../../../services/database/mealExceptionRepository';
import {
  isDishRestrictedByReligion,
  parseCustomFoodRestrictions,
  parseCustomFoodTerms,
  restrictionSourceLabel,
} from '../../../shared/constants/religion';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishLibrary'>;

export default function DishLibraryScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useAppDimensions();
  const menuWidth = Math.min(windowWidth - 48, 320);
  const lockSlot = route.params?.lockSlot === true;
  const currentUser = useAuthStore((s) => s.currentUser);
  const religion = useHouseholdStore((s) => s.settings?.religion ?? 'No Religious Restriction');
  const customFoodRestrictionsRaw = useHouseholdStore((s) => s.settings?.customFoodRestrictions);
  const customFoodRestrictions = useMemo(
    () => parseCustomFoodRestrictions(customFoodRestrictionsRaw),
    [customFoodRestrictionsRaw]
  );
  const customFoodTerms = useMemo(
    () => parseCustomFoodTerms(customFoodRestrictionsRaw),
    [customFoodRestrictionsRaw]
  );
  const restrictionLabel = restrictionSourceLabel(religion);
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
  const regenerateGrocery = useGroceryStore((s) => s.regenerate);
  const { members, loadMembers } = useFamilyStore();
  const [ingredientsByDishId, setIngredientsByDishId] = useState<Map<number, string[]>>(new Map());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [menuDish, setMenuDish] = useState<Dish | null>(null);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [pendingDishId, setPendingDishId] = useState<number | null>(null);
  const [pickedOpenSlot, setPickedOpenSlot] = useState(false);

  useEffect(() => {
    loadDishes();
  }, []);

  const openSlots = useMemo(
    () => listOpenMealSlots(entries, eatersBySlot),
    [entries, eatersBySlot]
  );
  const selectedIsOpen = openSlots.some(
    (slot) => slot.day === selectedDay && slot.meal === selectedMealType
  );
  const canAddToSelected = lockSlot || (pickedOpenSlot && selectedIsOpen);

  useEffect(() => {
    if (currentUser) loadMembers(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (dishes.length === 0) {
        setIngredientsByDishId(new Map());
        return;
      }
      const all = await getIngredientsForDishes(dishes.map((d) => d.id));
      if (cancelled) return;
      const map = new Map<number, string[]>();
      for (const ing of all) {
        const list = map.get(ing.dishId) ?? [];
        list.push(ing.ingredientName);
        map.set(ing.dishId, list);
      }
      setIngredientsByDishId(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [dishes]);

  const allergies = useMemo(() => collectAllergies(members), [members]);
  const safeDishes = useMemo(
    () => filterDishesByAllergies(dishes, ingredientsByDishId, allergies),
    [dishes, ingredientsByDishId, allergies]
  );
  const hiddenCount = dishes.length - safeDishes.length;
  const restrictedDishIds = useMemo(() => {
    const ids = new Set<number>();
    for (const dish of safeDishes) {
      const ingredients = ingredientsByDishId.get(dish.id) ?? [];
      if (
        isDishRestrictedByReligion(
          dish.name,
          dish.category,
          ingredients,
          religion,
          customFoodRestrictions,
          customFoodTerms
        )
      ) {
        ids.add(dish.id);
      }
    }
    return ids;
  }, [safeDishes, ingredientsByDishId, religion, customFoodRestrictions, customFoodTerms]);

  const visibleDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return safeDishes.filter((dish) => {
      if (category !== 'All' && dish.category !== category) return false;
      if (q && !dish.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [safeDishes, query, category]);

  const addDishToSlot = async (dishId: number, day: string, meal: string) => {
    if (!currentUser) return;
    if (restrictedDishIds.has(dishId)) {
      const dish = dishes.find((item) => item.id === dishId);
      if (!dish) return;
      confirmAction(
        'Food consideration warning',
        `${dish.name} is not recommended for ${restrictionLabel}. Add it as an exception and use it anyway? Auto-Plan will still respect this exception.`,
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
    const result = await planMeal(currentUser.id, dishId, day, meal);
    if (!result.ok) {
      notify('Cannot add dish', result.reason ?? 'Please pick another dish.');
      return;
    }
    navigation.navigate('MealPlanner');
  };

  const handleAddToPlanner = async (dishId: number) => {
    if (!currentUser) return;
    if (!canAddToSelected) {
      if (openSlots.length === 0) {
        notify('No free days', 'Every available meal already has a dish. Remove one first.');
        return;
      }
      setPendingDishId(dishId);
      setSlotPickerOpen(true);
      return;
    }
    await addDishToSlot(dishId, selectedDay, selectedMealType);
  };

  const handleDeleteMine = (dish: Dish) => {
    if (!currentUser) return;
    setMenuDish(null);
    // Let the menu Modal finish closing; iOS can't present the dialog Modal on top of it.
    setTimeout(() => confirmAction(
      'Delete this dish?',
      `Remove “${dish.name}” from your library? Planned meals using it will be cleared.`,
      'Delete',
      () =>
        void (async () => {
          const ok = await deleteCustomDish(currentUser.id, dish.id);
          if (!ok) {
            notify('Could not delete', 'Only your personal dishes can be deleted.');
            return;
          }
          await loadDishes();
          await loadEntries(currentUser.id);
          await regenerateGrocery(currentUser.id);
          notify('Dish deleted', `${dish.name} was removed.`);
        })(),
      { destructive: true }
    ), 350);
  };

  return (
    <View style={styles.root}>
      <BackHeader
        title="Dish Library"
        onBack={navigation.goBack}
        right={
          <Pressable
            onPress={() => {
              if (lockSlot) return;
              setPendingDishId(null);
              setSlotPickerOpen(true);
            }}
            disabled={lockSlot}
            style={styles.slotBadge}
          >
            <Text style={styles.slotBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {canAddToSelected ? `${selectedDay} · ${selectedMealType}` : 'Pick a free day'}
            </Text>
          </Pressable>
        }
      />

      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
        <RNTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for recipes..."
          placeholderTextColor={colors.onSurfaceVariant}
          style={styles.searchInput}
        />
      </View>

      <View>
        <FlatList
          horizontal
          data={[...DISH_CATEGORIES]}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => {
            const active = category === item;
            return (
              <Pressable
                onPress={() => setCategory(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={active ? styles.chipTextActive : styles.chipText}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {hiddenCount > 0 && (
        <Text style={styles.filterNote}>
          {hiddenCount} dish{hiddenCount === 1 ? '' : 'es'} hidden due to family allergies.
        </Text>
      )}

      <FlatList
        data={visibleDishes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('DishDetails', {
                dishId: String(item.id),
                pickSlot: !lockSlot,
              })
            }
          >
            <View style={styles.imageWrap}>
              <Image source={imageForDish(item.name, item.category, item.imageUri)} style={styles.image} />
              <View style={styles.timeBadge}>
                <MaterialIcons name="schedule" size={12} color="#fff" />
                <Text style={styles.timeBadgeText}>{item.prepTimeMinutes} min</Text>
              </View>
              {item.isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>My Dish</Text>
                </View>
              )}
              {item.isCustom && currentUser && item.createdBy === currentUser.id && (
                <Pressable
                  style={styles.cardMenuBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setMenuDish(item);
                  }}
                  hitSlop={8}
                >
                  <MaterialIcons name="more-vert" size={18} color={colors.onSurface} />
                </Pressable>
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.rowBetween}>
                <Text style={styles.dishName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.dishCost}>₱{Math.round(item.estimatedCost)}</Text>
              </View>
              <Text style={styles.servingsLine}>
                Good for {item.servings || 4}
                {members.length > 0 && (item.servings || 4) >= members.length
                  ? ` · fits your ${members.length}`
                  : ''}
              </Text>
              <View style={styles.tagRow}>
                                {restrictedDishIds.has(item.id) && (
                                  <View style={styles.religionWarningChip}>
                                    <MaterialIcons name="info-outline" size={12} color={colors.error} />
                                    <Text style={styles.religionWarningText}>Not recommended for {restrictionLabel}</Text>
                                  </View>
                                )}
                <View style={styles.tagChipPrimary}>
                  <Text style={styles.tagChipPrimaryText}>{item.category.toUpperCase()}</Text>
                </View>
                {item.tags
                  .split(',')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{tag.trim().toUpperCase()}</Text>
                    </View>
                  ))}
              </View>
              <View style={styles.actions}>
                <Button
                  label={restrictedDishIds.has(item.id) ? 'Allow and Add' : 'Add to Planner'}
                  onPress={() => handleAddToPlanner(item.id)}
                  style={styles.addButton}
                />
                <Pressable
                  onPress={() =>
                    navigation.navigate('DishDetails', {
                      dishId: String(item.id),
                      pickSlot: !lockSlot,
                    })
                  }
                  style={styles.viewButton}
                >
                  <MaterialIcons name="visibility" size={22} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {dishes.length === 0
              ? 'No dishes available yet.'
              : 'No dishes match your search or filters.'}
          </Text>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddDish')}
        accessibilityLabel="Add your own dish"
      >
        <MaterialIcons name="add" size={28} color={colors.onSecondaryContainer} />
      </Pressable>

      <EmptySlotPicker
        visible={slotPickerOpen}
        slots={openSlots}
        selected={canAddToSelected ? { day: selectedDay, meal: selectedMealType } : null}
        onClose={() => {
          setSlotPickerOpen(false);
          setPendingDishId(null);
        }}
        onSelect={(day, meal) => {
          setSelection(day, meal);
          setPickedOpenSlot(true);
          setSlotPickerOpen(false);
          const dishId = pendingDishId;
          setPendingDishId(null);
          if (dishId != null) {
            void addDishToSlot(dishId, day, meal);
          }
        }}
      />

      <Modal
        visible={!!menuDish}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuDish(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuDish(null)}>
          <View style={[styles.menuCard, { width: menuWidth }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menuDish?.name ?? 'My dish'}
            </Text>
            <Pressable
              style={styles.menuRow}
              onPress={() => {
                if (!menuDish) return;
                navigation.navigate('DishDetails', {
                  dishId: String(menuDish.id),
                  pickSlot: !lockSlot,
                });
                setMenuDish(null);
              }}
            >
              <MaterialIcons name="visibility" size={20} color={colors.primary} />
              <Text style={styles.menuRowText}>View details</Text>
            </Pressable>
            <Pressable
              style={styles.menuRow}
              onPress={() => menuDish && handleDeleteMine(menuDish)}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
              <Text style={styles.menuDeleteText}>Delete dish</Text>
            </Pressable>
            <Pressable style={styles.menuRow} onPress={() => setMenuDish(null)}>
              <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
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
    paddingHorizontal: spacing.marginMobile,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  brand: {
    ...typography.titleLg,
    color: colors.onSurface,
    flex: 1,
  },
  slotBadge: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    maxWidth: 160,
  },
  slotBadgeText: {
    ...typography.labelLg,
    fontSize: 12,
    color: colors.onPrimaryContainer,
    textTransform: 'capitalize',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  chipRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  chipTextActive: {
    ...typography.labelLg,
    fontSize: 13,
    color: colors.onPrimary,
  },
  filterNote: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 170,
  },
  timeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  timeBadgeText: {
    ...typography.labelLg,
    fontSize: 11,
    color: '#fff',
  },
  customBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  customBadgeText: {
    ...typography.labelLg,
    fontSize: 11,
    color: colors.onSecondaryContainer,
  },
  cardMenuBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
  },
  menuCard: {
    alignSelf: 'center',
    maxWidth: 320,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  menuTitle: {
    ...typography.titleMd,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuRowText: {
    ...typography.titleMd,
    fontSize: 15,
    color: colors.onSurface,
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
  content: {
    padding: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dishName: {
    flex: 1,
    ...typography.titleLg,
    fontSize: 20,
    color: colors.onSurface,
  },
  servingsLine: {
    ...typography.bodyMd,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  dishCost: {
    ...typography.titleMd,
    color: colors.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tagChipPrimary: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagChipPrimaryText: {
    ...typography.labelLg,
    fontSize: 10,
    color: colors.primary,
  },
  tagChip: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagChipText: {
    ...typography.labelLg,
    fontSize: 10,
    color: colors.secondary,
  },
  religionWarningChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.errorContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  religionWarningText: { ...typography.labelLg, fontSize: 10, color: colors.error },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    flex: 1,
    height: 48,
  },
  viewButton: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.marginMobile,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
