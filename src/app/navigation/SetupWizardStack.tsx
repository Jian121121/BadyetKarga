import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from './types';

import WizardWelcomeScreen from '../../features/setupWizard/screens/WizardWelcomeScreen';
import WizardHouseholdScreen from '../../features/setupWizard/screens/WizardHouseholdScreen';
import WizardGoalScreen from '../../features/setupWizard/screens/WizardGoalScreen';
import WizardFamilyScreen from '../../features/setupWizard/screens/WizardFamilyScreen';
import WizardAllergiesScreen from '../../features/setupWizard/screens/WizardAllergiesScreen';
import WizardAvailabilityScreen from '../../features/setupWizard/screens/WizardAvailabilityScreen';
import WizardPantryScreen from '../../features/setupWizard/screens/WizardPantryScreen';
import WizardCookingScreen from '../../features/setupWizard/screens/WizardCookingScreen';
import WizardCompleteScreen from '../../features/setupWizard/screens/WizardCompleteScreen';

const Stack = createNativeStackNavigator<SetupWizardStackParamList>();

export default function SetupWizardStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WizardWelcomeScreen} />
      <Stack.Screen name="Household" component={WizardHouseholdScreen} />
      <Stack.Screen name="Goal" component={WizardGoalScreen} />
      <Stack.Screen name="Family" component={WizardFamilyScreen} />
      <Stack.Screen name="Allergies" component={WizardAllergiesScreen} />
      <Stack.Screen name="Availability" component={WizardAvailabilityScreen} />
      <Stack.Screen name="Pantry" component={WizardPantryScreen} />
      <Stack.Screen name="Cooking" component={WizardCookingScreen} />
      <Stack.Screen name="Complete" component={WizardCompleteScreen} />
    </Stack.Navigator>
  );
}
