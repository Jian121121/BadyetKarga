import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Modal,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import BrandLogo from '../../../shared/components/BrandLogo';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useHouseholdStore } from '../../../store/householdStore';
import type { GroceryItem } from '../../../services/database/groceryRepository';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { getWeekDateRangeLabel } from '../../../shared/utils/week';
import {
  GROCERY_CATEGORIES,
  categorizeIngredient,
  categoryIcon,
} from '../../../shared/constants/groceryCategories';
import { calculateBudgetBreakdown } from '../../../shared/utils/householdServing';
import { formatBudgetBufferSummary } from '../../../algorithms/budgetBufferCalculator';
import { decimalOnly, isStrictDecimal } from '../../../shared/utils/validation';
import FadeIn from '../../../shared/motion/FadeIn';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'GroceryList'>;

function formatPeso(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(quantity: number, unit: string) {
  return `${Number(quantity.toFixed(2))} ${unit}`.trim();
}

function buildShareText(
  groups: Array<{ category: string; items: GroceryItem[] }>,
  total: number,
  weekLabel: string
) {
  const lines = [`BadyetKarga grocery list (${weekLabel})`, ''];
  for (const group of groups) {
    lines.push(group.category.toUpperCase());
    for (const item of group.items) {
      lines.push(
        `${item.isChecked ? '[x]' : '[ ]'} ${item.ingredientName} – ${formatQty(item.quantity, item.unit)} · ${formatPeso(item.estimatedCost)}`
      );
    }
    lines.push('');
  }
  lines.push(`Estimated total: ${formatPeso(total)}`);
  return lines.join('\n');
}

export default function GroceryListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useHouseholdStore((s) => s.settings);
  const { items, weeklyActualSpend, loadItems, regenerate, toggleItem, editPrice, addManualItem, removeItem } =
    useGroceryStore();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (currentUser) void loadItems(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && currentUser) void loadItems(currentUser.id);
    });
    return () => sub.remove();
  }, [currentUser?.id]);

  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const bufferPercentage = settings?.budgetBufferPercentage ?? 0;
  const { reservedBuffer, usableBudget } = calculateBudgetBreakdown(weeklyBudget, bufferPercentage);

  const totalCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);
  const committed = weeklyActualSpend + totalCost;
  const remaining = usableBudget - committed;
  const overBudget = remaining < 0;
  const percentUsed = usableBudget > 0 ? Math.round((committed / usableBudget) * 100) : 0;
  const checkedCount = items.filter((i) => i.isChecked).length;

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    for (const item of items) {
      const cat = categorizeIngredient(item.ingredientName);
      const list = map.get(cat) ?? [];
      list.push(item);
      map.set(cat, list);
    }
    return GROCERY_CATEGORIES.filter((c) => map.has(c.name)).map((c) => ({
      category: c.name as string,
      items: map.get(c.name)!,
    }));
  }, [items]);

  const handleShare = async () => {
    if (items.length === 0) {
      notify('Nothing to share', 'Plan some meals first so the list has items.');
      return;
    }
    const message = buildShareText(grouped, totalCost, getWeekDateRangeLabel());
    try {
      await Share.share({ message, title: 'Grocery list' });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        notify('List copied', 'Sharing is not available here, so the list was copied. Paste it into any chat.');
      } else {
        notify('Could not share', 'Sharing is not available on this device.');
      }
    }
  };

  const handleSavePrice = async (id: number) => {
    if (!isStrictDecimal(editValue) || !currentUser) {
      return;
    }
    await editPrice(id, Number(editValue), currentUser.id);
    setEditingId(null);
  };

  const handleRegenerate = async () => {
    if (!currentUser || regenerating) return;
    setRegenerating(true);
    try {
      await regenerate(currentUser.id);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAdd = async () => {
    if (!currentUser || !newName.trim() || !isStrictDecimal(newPrice)) return;
    await addManualItem(currentUser.id, newName.trim(), Number(newPrice));
    setNewName('');
    setNewPrice('');
    setAddVisible(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.topSpacer} />
        <BrandLogo size={28} />
        <Pressable
          onPress={() => void handleShare()}
          hitSlop={10}
          style={styles.shareBtn}
          accessibilityLabel="Share grocery list"
        >
          <MaterialIcons name="ios-share" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL ESTIMATED COST</Text>
          <Text style={styles.totalValue}>{formatPeso(totalCost)}</Text>
          <View style={styles.totalActions}>
            <Pressable
              onPress={() => navigation.navigate('BudgetOptimization')}
              style={styles.totalAction}
            >
              <MaterialIcons name="bolt" size={16} color={colors.onPrimary} />
              <Text style={styles.totalActionText}>Optimize Budget</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ShoppingMode')}
              style={styles.totalAction}
            >
              <MaterialIcons name="shopping-bag" size={16} color={colors.onPrimary} />
              <Text style={styles.totalActionText}>Shopping Mode</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.remainingCard}>
          <Text style={styles.remainingLabel}>
            {overBudget ? 'OVER BUDGET BY' : 'REMAINING AFTER SPENT + LIST'}
          </Text>
          <Text style={[styles.remainingValue, overBudget && { color: colors.error }]}>
            {formatPeso(Math.abs(remaining))}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentUsed, 100)}%`,
                  backgroundColor:
                    percentUsed > 100 ? colors.error : percentUsed > 85 ? colors.secondary : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {formatPeso(weeklyActualSpend)} spent + {formatPeso(totalCost)} on list = {percentUsed}% of{' '}
            {formatPeso(usableBudget)} meal budget
          </Text>
          {overBudget && (
            <Pressable onPress={() => navigation.navigate('BudgetOptimization')} hitSlop={6}>
              <Text style={styles.overHint}>Tap Optimize Budget to find cheaper swaps →</Text>
            </Pressable>
          )}
          {reservedBuffer > 0 && (
            <Text style={styles.progressCaption}>
              {formatBudgetBufferSummary(bufferPercentage, weeklyBudget, settings?.visitorBufferServings ?? 0)}
            </Text>
          )}
        </View>

        {items.length > 0 && (
          <Text style={styles.checkedProgress}>
            {checkedCount} of {items.length} items checked
          </Text>
        )}

        <Pressable
          onPress={handleRegenerate}
          disabled={regenerating}
          style={[styles.regenButton, regenerating && { opacity: 0.6 }]}
        >
          <MaterialIcons name="refresh" size={18} color={colors.primary} />
          <Text style={styles.regenText}>
            {regenerating ? 'Updating from meal plan…' : 'Regenerate from Meal Plan'}
          </Text>
        </Pressable>

        {grouped.map((group) => (
          <View key={group.category} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name={categoryIcon(group.category)}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{group.category}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {group.items.length} item{group.items.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            {group.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Pressable
                  onPress={() =>
                    currentUser && toggleItem(item.id, !item.isChecked, currentUser.id)
                  }
                  style={styles.checkbox}
                >
                  <MaterialIcons
                    name={item.isChecked ? 'check-circle' : 'radio-button-unchecked'}
                    size={24}
                    color={item.isChecked ? colors.primary : colors.outline}
                  />
                </Pressable>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.isChecked && styles.itemChecked]}>
                    {item.ingredientName}
                    <Text style={styles.itemQty}>
                      {' '}
                      ({formatQty(item.quantity, item.unit)})
                    </Text>
                  </Text>
                  <Text style={styles.usedIn} numberOfLines={1}>
                    {item.usedInDishes}
                  </Text>
                </View>
                {editingId === item.id ? (
                  <RNTextInput
                    value={editValue}
                    onChangeText={(value) => setEditValue(decimalOnly(value))}
                    keyboardType="numeric"
                    autoFocus
                    style={styles.priceInput}
                    onBlur={() => handleSavePrice(item.id)}
                    onSubmitEditing={() => handleSavePrice(item.id)}
                  />
                ) : (
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);
                      setEditValue(String(item.estimatedCost));
                    }}
                    onLongPress={() => {
                      confirmAction(
                        'Remove item?',
                        item.ingredientName,
                        'Remove',
                        () => void (currentUser && removeItem(item.id, currentUser.id)),
                        { destructive: true }
                      );
                    }}
                  >
                    <Text style={styles.itemPrice}>{formatPeso(item.estimatedCost)}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ))}

        {items.length === 0 && (
          <Text style={styles.empty}>
            No grocery items yet. Plan meals, then regenerate — pantry items are skipped
            automatically.
          </Text>
        )}
        </FadeIn>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: spacing.lg }]}
        onPress={() => setAddVisible(true)}
      >
        <MaterialIcons name="add" size={28} color={colors.onSecondaryContainer} />
      </Pressable>

      <Modal
        visible={addVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: spacing.md + insets.bottom }]}>
            <Text style={styles.modalTitle}>Add ingredient</Text>
            <RNTextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Ingredient name"
              placeholderTextColor={colors.onSurfaceVariant}
              style={styles.modalInput}
            />
            <RNTextInput
              value={newPrice}
              onChangeText={(value) => setNewPrice(decimalOnly(value))}
              placeholder="Price (₱)"
              keyboardType="numeric"
              placeholderTextColor={colors.onSurfaceVariant}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setAddVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleAdd} style={styles.modalSave}>
                <Text style={styles.modalSaveText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    height: 44,
  },
  topSpacer: { width: 30 },
  shareBtn: { padding: 4 },
  checkedProgress: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  overHint: { ...typography.labelLg, color: colors.error, marginTop: spacing.xs },
  scroll: { paddingHorizontal: spacing.marginMobile },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.labelLg,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.onPrimary,
    opacity: 0.85,
  },
  totalValue: {
    ...typography.displayLg,
    fontSize: 32,
    lineHeight: 40,
    color: colors.onPrimary,
    marginVertical: spacing.xs,
  },
  totalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  totalAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radii.default,
    paddingVertical: spacing.sm,
  },
  totalActionText: { ...typography.labelLg, fontSize: 12, color: colors.onPrimary },
  remainingCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  remainingLabel: {
    ...typography.labelLg,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
  },
  remainingValue: {
    ...typography.headlineLgMobile,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radii.default },
  progressCaption: {
    ...typography.bodyMd,
    fontStyle: 'italic',
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  regenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    height: 44,
    marginBottom: spacing.md,
  },
  regenText: { ...typography.titleMd, fontSize: 14, color: colors.primary },
  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.titleMd, fontSize: 16, color: colors.onSurface, flex: 1 },
  countBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  countBadgeText: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  checkbox: { padding: 2 },
  itemInfo: { flex: 1 },
  itemName: { ...typography.bodyLg, color: colors.onSurface },
  itemQty: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  usedIn: { ...typography.labelLg, color: colors.tertiary, marginTop: 2 },
  itemPrice: { ...typography.titleMd, fontSize: 15, color: colors.secondary },
  priceInput: {
    ...typography.titleMd,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
    textAlign: 'right',
    color: colors.onSurface,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.marginMobile,
    gap: spacing.sm,
  },
  modalTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.xs },
  modalInput: {
    ...typography.bodyLg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { ...typography.titleMd, fontSize: 15, color: colors.onSurfaceVariant },
  modalSave: {
    flex: 1,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: { ...typography.titleMd, fontSize: 15, color: colors.onPrimary },
});
