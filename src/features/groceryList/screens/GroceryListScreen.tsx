import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<GroceriesStackParamList, 'GroceryList'>;

export default function GroceryListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grocery List</Text>
      <Button title="Optimize Budget" onPress={() => navigation.navigate('BudgetOptimization')} />
      <Button title="Shopping Mode" onPress={() => navigation.navigate('ShoppingMode')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});