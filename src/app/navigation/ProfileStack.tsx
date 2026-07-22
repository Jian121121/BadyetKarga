import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';

import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import FamilyManagementScreen from '../../features/familyManagement/screens/FamilyManagementScreen';
import WeeklyAvailabilityScreen from '../../features/weeklyAvailability/screens/WeeklyAvailabilityScreen';
import PantryScreen from '../../features/pantry/screens/PantryScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="FamilyManagement" component={FamilyManagementScreen} options={{ title: 'Family Members' }} />
      <Stack.Screen name="WeeklyAvailability" component={WeeklyAvailabilityScreen} options={{ title: 'Weekly Availability' }} />
      <Stack.Screen name="Pantry" component={PantryScreen} options={{ title: 'Pantry' }} />
    </Stack.Navigator>
  );
}