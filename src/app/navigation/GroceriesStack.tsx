import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GroceriesStackParamList } from './types';

import GroceryListScreen from '../../features/groceryList/screens/GroceryListScreen';
import BudgetOptimizationScreen from '../../features/budgetOptimization/screens/BudgetOptimizationScreen';
import ShoppingModeScreen from '../../features/shoppingMode/screens/ShoppingModeScreen';

const Stack = createNativeStackNavigator<GroceriesStackParamList>();

export default function GroceriesStack() {
  return (
    <Stack.Navigator initialRouteName="GroceryList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroceryList" component={GroceryListScreen} />
      <Stack.Screen name="BudgetOptimization" component={BudgetOptimizationScreen} />
      <Stack.Screen name="ShoppingMode" component={ShoppingModeScreen} />
    </Stack.Navigator>
  );
}