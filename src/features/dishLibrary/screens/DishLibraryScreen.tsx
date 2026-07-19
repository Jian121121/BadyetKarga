import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<PlannerStackParamList, 'DishLibrary'>;

export default function DishLibraryScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dish Library</Text>
      <Button
        title="Open Chicken Adobo Details"
        onPress={() => navigation.navigate('DishDetails', { dishId: 'chicken-adobo' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});