import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import BackHeader from '../../../shared/components/BackHeader';
import { useAuthStore } from '../../../store/authStore';
import { useMealPlanStore } from '../../../store/mealPlanStore';
import { useFamilyStore } from '../../../store/familyStore';
import { useGroceryStore } from '../../../store/groceryStore';
import {
  addCustomDish,
  updateCustomDish,
  type NewIngredientInput,
} from '../../../services/database/dishRepository';
import { getIngredientsForDish } from '../../../services/database/dishIngredientRepository';
import { durableImageUri, IMAGE_PICKER_OPTS } from '../../../shared/utils/persistImage';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import {
  digitsOnly,
  decimalOnly,
  isMeasurementUnit,
  isStrictDecimal,
  isStrictInteger,
  UNIT_CHOICES,
} from '../../../shared/utils/validation';

type Props = NativeStackScreenProps<PlannerStackParamList, 'AddDish'>;

const CATEGORIES = ['Breakfast', 'Chicken', 'Pork', 'Beef', 'Fish & Seafood', 'Vegetables', 'Soup', 'Noodles', 'Snack', 'Dessert'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const TAGS = ['Budget Friendly', 'Healthy', 'Traditional Filipino', 'Quick Meals', 'Family Favorite'];
const BASE_SERVING_OPTIONS = [1, 2, 3, 4, 6, 8];
const PREP_TIME_OPTIONS = [
  { minutes: 15, label: '15 minutes' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 45, label: '45 minutes' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1 hour 30 minutes' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
];
const MAX_NAME = 60;

interface DraftIngredient {
  name: string;
  quantity: string;
  unit: string;
  price: string;
  optional: boolean;
}

const emptyIngredient = (): DraftIngredient => ({ name: '', quantity: '1', unit: 'pc', price: '', optional: false });

const isBlankRow = (ing: DraftIngredient) => !ing.name.trim() && !ing.price.trim();

function rowErrors(ing: DraftIngredient): string[] {
  if (isBlankRow(ing)) return [];
  const errors: string[] = [];
  if (!ing.name.trim()) errors.push('name');
  if (!isStrictDecimal(ing.quantity, false)) errors.push('amount');
  if (!isMeasurementUnit(ing.unit)) errors.push('unit');
  if (!isStrictDecimal(ing.price)) errors.push('price');
  return errors;
}

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
}

export default function AddDishScreen({ navigation, route }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 420);
  const editId = route.params?.dishId;
  const isEdit = editId !== undefined;
  const currentUser = useAuthStore((s) => s.currentUser);
  const dishes = useMealPlanStore((s) => s.dishes);
  const loadDishes = useMealPlanStore((s) => s.loadDishes);
  const loadEntries = useMealPlanStore((s) => s.loadEntries);
  const regenerateGrocery = useGroceryStore((s) => s.regenerate);
  const members = useFamilyStore((s) => s.members);
  const loadMembers = useFamilyStore((s) => s.loadMembers);

  const householdSize = Math.max(1, members.length);
  const servingOptions = useMemo(() => {
    const set = new Set([...BASE_SERVING_OPTIONS, householdSize]);
    return Array.from(set).sort((a, b) => a - b);
  }, [householdSize]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [mealTypes, setMealTypes] = useState<string[]>(['lunch', 'dinner']);
  const [tags, setTags] = useState<string[]>([]);
  const [prepTime, setPrepTime] = useState('30');
  const [servings, setServings] = useState(String(householdSize));
  const [servingsTouched, setServingsTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([emptyIngredient()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [prepTimeModalOpen, setPrepTimeModalOpen] = useState(false);
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);
  const [loadedEdit, setLoadedEdit] = useState(!isEdit);
  const initialSnapshot = useRef<string | null>(null);

  // Servings auto-follow the household size until the user picks one, so they only count once touched.
  const snapshot = JSON.stringify({
    name,
    category,
    mealTypes,
    tags,
    prepTime,
    servings: servingsTouched ? servings : null,
    description,
    imageUri,
    ingredients,
  });

  useEffect(() => {
    if (currentUser) void loadMembers(currentUser.id);
    if (dishes.length === 0) void loadDishes();
  }, [currentUser?.id]);

  useEffect(() => {
    if (isEdit || servingsTouched) return;
    setServings(String(householdSize));
  }, [householdSize, isEdit, servingsTouched]);

  // Fill the form when editing an existing custom dish.
  useEffect(() => {
    if (!isEdit || loadedEdit) return;
    const dish = dishes.find((d) => d.id === editId);
    if (!dish) return;
    void getIngredientsForDish(dish.id).then((rows) => {
      setName(dish.name);
      setCategory(dish.category);
      setMealTypes(dish.mealTypes.split(',').map((m) => m.trim()).filter(Boolean));
      setTags(dish.tags.split(',').map((t) => t.trim()).filter(Boolean));
      setPrepTime(String(dish.prepTimeMinutes));
      setServings(String(dish.servings));
      setDescription(dish.description ?? '');
      setImageUri(dish.imageUri ?? null);
      setIngredients(
        rows.length > 0
          ? rows.map((r) => ({
              name: r.ingredientName,
              quantity: String(r.quantity),
              unit: isMeasurementUnit(r.unit) ? r.unit : 'pc',
              price: String(r.estimatedPrice),
              optional: r.priority === 'low',
            }))
          : [emptyIngredient()]
      );
      setLoadedEdit(true);
    });
  }, [isEdit, loadedEdit, dishes, editId]);

  // Take the "clean" snapshot once the form has its starting values.
  useEffect(() => {
    if (loadedEdit && initialSnapshot.current === null) initialSnapshot.current = snapshot;
  }, [loadedEdit, snapshot]);

  const dirty = initialSnapshot.current !== null && snapshot !== initialSnapshot.current;

  usePreventRemove(dirty && !saved, ({ data }) => {
    confirmAction(
      'Discard changes?',
      isEdit ? 'Your edits to this dish will be lost.' : 'The dish you started will be lost.',
      'Discard',
      () => navigation.dispatch(data.action),
      { destructive: true }
    );
  });

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const updateIngredient = (index: number, patch: Partial<DraftIngredient>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };

  const removeIngredient = (index: number) => {
    const ing = ingredients[index];
    if (!ing) return;
    if (isBlankRow(ing)) {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    confirmAction(
      'Remove ingredient?',
      `Remove ${ing.name.trim() || 'this ingredient'} from the list?`,
      'Remove',
      () => setIngredients((prev) => prev.filter((_, i) => i !== index)),
      { destructive: true }
    );
  };

  const pickDishPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo access to add a dish photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ ...IMAGE_PICKER_OPTS, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) setImageUri(durableImageUri(result.assets[0]));
  };

  const takeDishPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow camera access to take a dish photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ ...IMAGE_PICKER_OPTS, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) setImageUri(durableImageUri(result.assets[0]));
  };

  const filledRows = ingredients.filter((ing) => !isBlankRow(ing));
  const invalidRows = filledRows.filter((ing) => rowErrors(ing).length > 0);
  const totalCost = filledRows
    .filter((ing) => rowErrors(ing).length === 0)
    .reduce((sum, ing) => sum + Number(ing.price), 0);

  const missing: string[] = [];
  if (!name.trim()) missing.push('a dish name');
  if (!category) missing.push('a category');
  if (mealTypes.length === 0) missing.push('at least one meal time');
  if (filledRows.length === 0) missing.push('at least one ingredient');

  const performSave = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      const payload: NewIngredientInput[] = filledRows.map((ing) => ({
        ingredientName: ing.name.trim(),
        quantity: Number(ing.quantity),
        unit: ing.unit,
        estimatedPrice: Number(ing.price),
        priority: ing.optional ? 'low' : 'high',
      }));
      const details = {
        name: name.trim(),
        category,
        mealTypes: mealTypes.join(','),
        prepTimeMinutes: Number(prepTime),
        servings: Number(servings),
        description: description.trim(),
        tags: tags.join(','),
        imageUri,
      };
      if (isEdit) {
        const ok = await updateCustomDish(currentUser.id, editId, details, payload);
        if (!ok) {
          notify('Could not save dish', 'Only your own dishes can be edited.');
          return;
        }
      } else {
        await addCustomDish(currentUser.id, details, payload);
      }
      await loadDishes();
      if (isEdit) {
        await loadEntries(currentUser.id);
        await regenerateGrocery(currentUser.id);
      }
      setSaved(true);
      notify(
        isEdit ? 'Dish updated!' : 'Dish added!',
        isEdit
          ? `${details.name} is updated. Planned meals and your grocery list now use the new ingredients.`
          : `${details.name} is now in your Dish Library and will be suggested in weekly plans.`,
        () => navigation.goBack()
      );
    } catch {
      notify('Could not save dish', 'Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (saving) return;
    setShowErrors(true);
    if (missing.length > 0) {
      notify('Almost there', `Please add ${missing.join(', ')}.`);
      return;
    }
    if (invalidRows.length > 0) {
      notify(
        'Check your ingredients',
        `${invalidRows.length} ingredient${invalidRows.length === 1 ? ' is' : 's are'} incomplete (outlined in red). Fill in the missing details or remove ${invalidRows.length === 1 ? 'it' : 'them'}.`
      );
      return;
    }
    if (!isStrictInteger(servings, false)) {
      notify('Check servings', 'Servings must be a whole number greater than zero.');
      return;
    }
    const duplicate = dishes.find(
      (d) => d.id !== editId && d.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      confirmAction(
        'Name already in your library',
        `There is already a dish called “${duplicate.name}”. Save this one with the same name anyway?`,
        'Save Anyway',
        () => void performSave()
      );
      return;
    }
    void performSave();
  };

  const renderChips = (
    options: string[],
    selectedList: string[],
    onToggle: (value: string) => void,
    single = false
  ) => (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = single ? selectedList[0] === option : selectedList.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => onToggle(option)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={selected ? styles.chipTextSelected : styles.chipText}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!loadedEdit) {
    return (
      <View style={styles.root}>
        <BackHeader title="Edit Dish" onBack={navigation.goBack} />
        <Text style={styles.loading}>Loading dish…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackHeader title={isEdit ? 'Edit Dish' : 'Add Your Own Dish'} onBack={navigation.goBack} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isEdit && (
          <Text style={styles.intro}>
            Your dish joins your library with your own ingredient prices, and the weekly plan
            generator can suggest it to your family.
          </Text>
        )}

        <Pressable style={styles.photoCard} onPress={() => void pickDishPhoto()}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={28} color={colors.primary} />
              <Text style={styles.photoHint}>Add dish photo</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.photoActions}>
          <Pressable style={styles.photoBtn} onPress={() => void takeDishPhoto()}>
            <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
            <Text style={styles.photoBtnText}>Camera</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={() => void pickDishPhoto()}>
            <MaterialIcons name="photo-library" size={16} color={colors.primary} />
            <Text style={styles.photoBtnText}>Gallery</Text>
          </Pressable>
          {imageUri ? (
            <Pressable style={styles.photoBtn} onPress={() => setImageUri(null)}>
              <MaterialIcons name="close" size={16} color={colors.error} />
              <Text style={[styles.photoBtnText, { color: colors.error }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>

        <TextInput
          label="Dish Name"
          value={name}
          onChangeText={(value) => setName(value.slice(0, MAX_NAME))}
          placeholder="e.g. Lola's 7-Up Adobo"
          error={showErrors && !name.trim() ? 'Give your dish a name.' : undefined}
        />

        <Text style={styles.fieldLabel}>Category</Text>
        {renderChips(CATEGORIES, [category], (c) => setCategory(c), true)}
        {showErrors && !category && <Text style={styles.inlineError}>Pick a category.</Text>}

        <Text style={styles.fieldLabel}>Meal times</Text>
        {renderChips(MEAL_TYPES, mealTypes, (m) => toggle(mealTypes, m, setMealTypes))}
        {showErrors && mealTypes.length === 0 && (
          <Text style={styles.inlineError}>Pick at least one meal time.</Text>
        )}

        <Text style={styles.fieldLabel}>Style tags (optional)</Text>
        {renderChips(TAGS, tags, (t) => toggle(tags, t, setTags))}

        <Text style={styles.fieldLabel}>Servings · how many does this recipe feed?</Text>
        <Text style={styles.servingHint}>
          Enter the ingredient amounts for this many people. The app scales them to whoever is
          eating. Your household has {householdSize} member{householdSize === 1 ? '' : 's'}.
        </Text>
        <View style={styles.chipRow}>
          {servingOptions.map((n) => {
            const selected = parseInt(servings, 10) === n;
            const isSuggested = n === householdSize;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  setServingsTouched(true);
                  setServings(String(n));
                }}
                style={[
                  styles.chip,
                  selected && styles.chipSelected,
                  isSuggested && !selected && styles.chipSuggested,
                ]}
              >
                <Text style={selected ? styles.chipTextSelected : styles.chipText}>
                  {n}
                  {isSuggested ? ' · family' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          label="Or type custom servings"
          value={servings}
          onChangeText={(v) => {
            setServingsTouched(true);
            setServings(digitsOnly(v));
          }}
          keyboardType="numeric"
          placeholder={String(householdSize)}
        />

        <Text style={styles.fieldLabel}>Prep Time</Text>
        <Pressable style={styles.selectField} onPress={() => setPrepTimeModalOpen(true)}>
          <View style={styles.selectValueRow}>
            <MaterialIcons name="schedule" size={20} color={colors.primary} />
            <Text style={styles.selectValue}>
              {PREP_TIME_OPTIONS.find((option) => String(option.minutes) === prepTime)?.label ?? `${prepTime} minutes`}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
        </Pressable>

        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="What makes this dish special?"
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ingredients & Prices</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{formatPeso(totalCost)} total</Text>
          </View>
        </View>
        <Text style={styles.servingHint}>
          Enter how much you buy and the total price you pay for that amount.
        </Text>

        {ingredients.map((ing, index) => {
          const errors = showErrors ? rowErrors(ing) : [];
          const qty = Number(ing.quantity);
          const price = Number(ing.price);
          const showPerUnit =
            isStrictDecimal(ing.quantity, false) && isStrictDecimal(ing.price) && price > 0 && qty !== 1;
          return (
            <View key={index} style={[styles.ingredientCard, errors.length > 0 && styles.ingredientCardError]}>
              <View style={styles.ingredientTopRow}>
                <RNTextInput
                  value={ing.name}
                  onChangeText={(v) => updateIngredient(index, { name: v })}
                  placeholder="Ingredient name"
                  placeholderTextColor={colors.onSurfaceVariant}
                  style={[styles.smallInput, styles.nameInput, errors.includes('name') && styles.inputError]}
                />
                {ingredients.length > 1 && (
                  <Pressable onPress={() => removeIngredient(index)} hitSlop={8} accessibilityLabel="Remove ingredient">
                    <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                  </Pressable>
                )}
              </View>
              <View style={styles.ingredientBottomRow}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldHint}>Amount</Text>
                  <RNTextInput
                    value={ing.quantity}
                    onChangeText={(v) => updateIngredient(index, { quantity: decimalOnly(v) })}
                    placeholder="1"
                    keyboardType="numeric"
                    placeholderTextColor={colors.onSurfaceVariant}
                    style={[styles.smallInput, styles.qtyInput, errors.includes('amount') && styles.inputError]}
                  />
                </View>
                <View style={[styles.fieldBlock, styles.unitBlock]}>
                  <Text style={styles.fieldHint}>Unit</Text>
                  <Pressable
                    onPress={() => setUnitPickerIndex(index)}
                    style={[styles.smallInput, styles.unitSelect, errors.includes('unit') && styles.inputError]}
                  >
                    <Text style={styles.unitText}>{ing.unit || 'Pick'}</Text>
                    <MaterialIcons name="expand-more" size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
                <View style={[styles.fieldBlock, styles.priceBlock]}>
                  <Text style={styles.fieldHint}>Total price</Text>
                  <View style={styles.priceWrap}>
                    <Text style={styles.pesoSign}>₱</Text>
                    <RNTextInput
                      value={ing.price}
                      onChangeText={(v) => updateIngredient(index, { price: decimalOnly(v) })}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor={colors.onSurfaceVariant}
                      style={[styles.smallInput, styles.priceField, errors.includes('price') && styles.inputError]}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.ingredientFooter}>
                <Pressable
                  onPress={() => updateIngredient(index, { optional: !ing.optional })}
                  style={styles.optionalToggle}
                  hitSlop={6}
                >
                  <MaterialIcons
                    name={ing.optional ? 'check-box' : 'check-box-outline-blank'}
                    size={18}
                    color={ing.optional ? colors.primary : colors.outline}
                  />
                  <Text style={styles.optionalText}>Optional (can skip to save money)</Text>
                </Pressable>
                {showPerUnit && (
                  <Text style={styles.perUnit}>
                    ≈ {formatPeso(price / qty)} / {ing.unit}
                  </Text>
                )}
              </View>
              {errors.length > 0 && (
                <Text style={styles.inlineError}>Missing or invalid: {errors.join(', ')}.</Text>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          style={styles.addIngredientButton}
        >
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <Text style={styles.addIngredientText}>Add Ingredient</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.md }]}>
        <Button
          label={isEdit ? 'Save Changes' : 'Save Dish'}
          onPress={handleSave}
          disabled={isEdit && !dirty}
          loading={saving}
        />
      </View>
      </KeyboardAvoidingView>

      <Modal visible={prepTimeModalOpen} transparent animationType="slide" onRequestClose={() => setPrepTimeModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPrepTimeModalOpen(false)} />
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>How long does it take?</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {PREP_TIME_OPTIONS.map((option) => {
                const selected = prepTime === String(option.minutes);
                return (
                  <Pressable
                    key={option.minutes}
                    style={[styles.choiceRow, selected && styles.choiceRowSelected]}
                    onPress={() => {
                      setPrepTime(String(option.minutes));
                      setPrepTimeModalOpen(false);
                    }}
                  >
                    <View style={styles.selectValueRow}>
                      <MaterialIcons name="schedule" size={18} color={selected ? colors.primary : colors.onSurfaceVariant} />
                      <Text style={selected ? styles.choiceTextSelected : styles.choiceText}>{option.label}</Text>
                    </View>
                    {selected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={unitPickerIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitPickerIndex(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setUnitPickerIndex(null)} />
          <View style={[styles.sheetCard, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Pick a unit</Text>
            <Text style={styles.modalSubtitle}>How is this ingredient measured or sold?</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <View style={styles.unitGrid}>
                {UNIT_CHOICES.map(({ unit, hint }) => {
                  const selected = unitPickerIndex !== null && ingredients[unitPickerIndex]?.unit === unit;
                  return (
                    <Pressable
                      key={unit}
                      style={[styles.unitChoice, selected && styles.unitChoiceSelected]}
                      onPress={() => {
                        if (unitPickerIndex !== null) updateIngredient(unitPickerIndex, { unit });
                        setUnitPickerIndex(null);
                      }}
                    >
                      <Text style={[styles.unitChoiceText, selected && styles.unitChoiceTextSelected]}>{unit}</Text>
                      <Text style={styles.unitChoiceHint}>{hint}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  loading: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },
  intro: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  photoCard: {
    height: 140,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoHint: { ...typography.labelLg, color: colors.primary },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: spacing.sm },
  photoBtnText: { ...typography.labelLg, fontSize: 13, color: colors.primary },
  fieldLabel: { ...typography.titleMd, fontSize: 15, color: colors.onSurface, marginBottom: spacing.sm },
  inlineError: { ...typography.bodyMd, fontSize: 12, color: colors.error, marginTop: -spacing.xs, marginBottom: spacing.sm },
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
  selectValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectValue: { ...typography.bodyLg, color: colors.onSurface },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.marginMobile,
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
  modalTitle: { ...typography.titleLg, color: colors.onSurface },
  modalSubtitle: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  choiceRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: 2,
  },
  choiceRowSelected: { backgroundColor: colors.primaryContainer },
  choiceText: { ...typography.bodyLg, color: colors.onSurface },
  choiceTextSelected: { ...typography.titleMd, color: colors.primary },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.xs },
  unitChoice: {
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  unitChoiceSelected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  unitChoiceText: { ...typography.titleMd, fontSize: 15, color: colors.onSurface },
  unitChoiceTextSelected: { color: colors.primary },
  unitChoiceHint: { ...typography.bodyMd, fontSize: 11, color: colors.onSurfaceVariant, textAlign: 'center' },
  servingHint: {
    ...typography.bodyMd,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  chipSuggested: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipSelected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  chipText: { ...typography.labelLg, fontSize: 13, color: colors.onSurfaceVariant, textTransform: 'capitalize' },
  chipTextSelected: { ...typography.labelLg, fontSize: 13, color: colors.primary, textTransform: 'capitalize' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.titleLg, fontSize: 19, color: colors.onSurface },
  countPill: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  countPillText: { ...typography.labelLg, fontSize: 12, color: colors.onSecondaryContainer },
  ingredientCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  ingredientCardError: { borderColor: colors.error },
  ingredientTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ingredientBottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  ingredientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionalText: { ...typography.bodyMd, fontSize: 12, color: colors.onSurfaceVariant },
  perUnit: { ...typography.labelLg, fontSize: 12, color: colors.tertiary },
  fieldBlock: { width: 64 },
  unitBlock: { flex: 1, minWidth: 72, width: undefined },
  priceBlock: { width: 110 },
  fieldHint: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 4 },
  smallInput: {
    ...typography.bodyLg,
    fontSize: 15,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    height: 44,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  nameInput: { flex: 1 },
  qtyInput: { width: '100%', textAlign: 'center' },
  unitSelect: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unitText: { ...typography.bodyLg, fontSize: 15, color: colors.onSurface },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pesoSign: { ...typography.titleMd, fontSize: 15, color: colors.onSurfaceVariant },
  priceField: { flex: 1, textAlign: 'right', minWidth: 0 },
  addIngredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radii.full,
    height: 48,
    marginTop: spacing.xs,
  },
  addIngredientText: { ...typography.titleMd, fontSize: 14, color: colors.primary },
  footer: { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.sm, backgroundColor: colors.background },
});
