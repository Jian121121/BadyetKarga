import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';

import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import EditHouseholdScreen from '../../features/profile/screens/EditHouseholdScreen';
import ChangePasswordScreen from '../../features/profile/screens/ChangePasswordScreen';
import PrivacyPolicyScreen from '../../features/profile/screens/PrivacyPolicyScreen';
import AboutScreen from '../../features/profile/screens/AboutScreen';
import FamilyManagementScreen from '../../features/familyManagement/screens/FamilyManagementScreen';
import WeeklyAvailabilityScreen from '../../features/weeklyAvailability/screens/WeeklyAvailabilityScreen';
import PantryScreen from '../../features/pantry/screens/PantryScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="Profile" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="EditHousehold"
        component={EditHouseholdScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen
        name="FamilyManagement"
        component={FamilyManagementScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeeklyAvailability"
        component={WeeklyAvailabilityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Pantry"
        component={PantryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
