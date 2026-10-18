import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import { calculateBudgetBreakdown } from '../../../shared/utils/householdServing';
import TextInput from '../../../shared/components/TextInput';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore } from '../../../store/groceryStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { decimalOnly, isStrictDecimal } from '../../../shared/utils/validation';
import BackHeader from '../../../shared/components/BackHeader';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'ShoppingMode'>;

export default function ShoppingModeScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { items, weeklyActualSpend, loadItems, toggleItem, completeShopping } = useGroceryStore();
  const settings = useHouseholdStore((s) => s.settings);
  const weeklyBudget = settings?.weeklyBudget ?? 0;
  const [actualPrices, setActualPrices] = useState<Record<number, string>>({});
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (currentUser) void loadItems(currentUser.id);
  }, [currentUser?.id]);

  const parseActual = (id: number, fallback: number) => {
    const raw = actualPrices[id];
    return raw !== undefined && isStrictDecimal(raw) ? Number(raw) : fallback;
  };

  const checked = items.filter((i) => i.isChecked);
  const actualTotal = checked.reduce(
    (sum, item) => sum + parseActual(item.id, item.estimatedCost),
    0
  );
  const { usableBudget } = calculateBudgetBreakdown(
    weeklyBudget,
    settings?.budgetBufferPercentage ?? 0
  );
  const remaining = usableBudget - weeklyActualSpend - actualTotal;

  const unchecked = items.length - checked.length;

  const saveTrip = async () => {
    if (!currentUser || completing) return;
    setCompleting(true);
    try {
      const prices: Record<number, number> = {};
      for (const item of checked) {
        const raw = actualPrices[item.id];
        if (raw !== undefined && isStrictDecimal(raw)) prices[item.id] = Number(raw);
      }
      const result = await completeShopping(currentUser.id, prices);
      notify(
        'Trip saved!',
        `${result.itemCount} item${result.itemCount === 1 ? '' : 's'} · ₱${result.actualTotal.toFixed(2)} added to analytics. ` +
          (unchecked > 0
            ? `${unchecked} item${unchecked === 1 ? '' : 's'} stay on your list for the next trip.`
            : 'Pantry updated so future lists skip what you bought.'),
        () => navigation.goBack()
      );
    } catch {
      notify('Could not complete trip', 'Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleComplete = () => {
    if (checked.length === 0) {
      notify('Nothing checked', 'Check the items you bought before saving the trip.');
      return;
    }
    if (unchecked > 0) {
      confirmAction(
        'Save a partial trip?',
        `You bought ${checked.length} of ${items.length} items. The other ${unchecked} stay on your list for your next trip.`,
        'Save Trip',
        () => void saveTrip()
      );
      return;
    }
    void saveTrip();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackHeader title="Shopping Mode" onBack={navigation.goBack} />

      <View style={styles.summaryRow}>
        <Text style={styles.remainingLabel}>Remaining Budget</Text>
        <Text style={[styles.remainingAmount, remaining < 0 && styles.negative]}>
          ₱{remaining.toFixed(2)}
        </Text>
        <Text style={styles.checkedHint}>
          {checked.length} checked · enter actual prices as you shop
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Pressable
              style={styles.checkbox}
              onPress={() => currentUser && toggleItem(item.id, !item.isChecked, currentUser.id)}
            >
              <MaterialIcons
                name={item.isChecked ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={item.isChecked ? colors.primary : colors.outline}
              />
            </Pressable>
            <Text style={[styles.itemName, item.isChecked && styles.itemChecked]}>
              {item.ingredientName}
            </Text>
            <TextInput
              label=""
              value={actualPrices[item.id] ?? ''}
              onChangeText={(text) => setActualPrices((prev) => ({ ...prev, [item.id]: decimalOnly(text) }))}
              keyboardType="numeric"
              placeholder={`₱${item.estimatedCost}`}
              style={styles.priceInput}
              containerStyle={styles.priceInputContainer}
              accessibilityLabel={`Actual price for ${item.ingredientName}`}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No items to shop for yet.</Text>}
      />

      <View style={[styles.footer, { paddingBottom: spacing.md }]}>
        <Button
          label={
            checked.length === 0
              ? 'Check items you bought'
              : unchecked === 0
                ? 'Complete Shopping'
                : `Save Trip (${checked.length} of ${items.length})`
          }
          onPress={handleComplete}
          loading={completing}
          disabled={checked.length === 0}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  summaryRow: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.marginMobile,
    marginBottom: spacing.md,
  },
  remainingLabel: {
    ...typography.labelLg,
    color: colors.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  remainingAmount: { ...typography.displayLg, fontSize: 36, color: colors.onPrimaryContainer },
  negative: { color: colors.error },
  checkedHint: { ...typography.bodyMd, color: colors.onPrimaryContainer, marginTop: 4 },
  list: { gap: spacing.sm, paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.sm,
  },
  checkbox: { padding: spacing.xs },
  itemName: { ...typography.bodyLg, color: colors.onSurface, flex: 1 },
  itemChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  priceInput: { width: 96, height: 44 },
  priceInputContainer: { marginBottom: 0 },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.marginMobile, paddingTop: spacing.sm },
});
