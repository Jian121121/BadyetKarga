import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<PlannerStackParamList, 'MealPlanner'>;

export default function MealPlannerScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meal Planner</Text>
      <Button title="Open Dish Library" onPress={() => navigation.navigate('DishLibrary')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});