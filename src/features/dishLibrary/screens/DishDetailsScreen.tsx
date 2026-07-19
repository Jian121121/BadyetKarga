import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishDetails'>;

export default function DishDetailsScreen({ route }: Props) {
  const { dishId } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dish Details</Text>
      <Text>Dish ID: {dishId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});