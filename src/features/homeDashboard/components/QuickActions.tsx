import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../../shared/theme';
import Button from '../../../shared/components/Button';

interface QuickActionsProps {
  onPlanMeals: () => void;
  onGenerateGroceryList: () => void;
  onShoppingMode: () => void;
}

export default function QuickActions({ onPlanMeals, onGenerateGroceryList, onShoppingMode }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <Button label="Plan Meals" onPress={onPlanMeals} variant="filled" />
      <Button label="Generate Grocery List" onPress={onGenerateGroceryList} variant="filled" />
      <Button label="Shopping Mode" onPress={onShoppingMode} variant="outlined" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});