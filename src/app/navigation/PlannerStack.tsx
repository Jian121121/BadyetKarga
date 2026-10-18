import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PlannerStackParamList } from './types';

import MealPlannerScreen from '../../features/mealPlanner/screens/MealPlannerScreen';
import DishLibraryScreen from '../../features/dishLibrary/screens/DishLibraryScreen';
import DishDetailsScreen from '../../features/dishLibrary/screens/DishDetailsScreen';
import AddDishScreen from '../../features/dishLibrary/screens/AddDishScreen';

const Stack = createNativeStackNavigator<PlannerStackParamList>();

export default function PlannerStack() {
  return (
    <Stack.Navigator initialRouteName="MealPlanner" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealPlanner" component={MealPlannerScreen} />
      <Stack.Screen name="DishLibrary" component={DishLibraryScreen} />
      <Stack.Screen name="DishDetails" component={DishDetailsScreen} />
      <Stack.Screen name="AddDish" component={AddDishScreen} />
    </Stack.Navigator>
  );
}   