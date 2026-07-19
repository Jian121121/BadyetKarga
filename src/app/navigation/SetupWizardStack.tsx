import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SetupWizardStackParamList } from './types';

import WizardPlaceholderScreen from '../../features/setupWizard/screens/WizardPlaceholderScreen';

const Stack = createNativeStackNavigator<SetupWizardStackParamList>();

export default function SetupWizardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Temporary: real 8-step wizard replaces this in Phase 9 */}
      <Stack.Screen name="HouseholdInfo" component={WizardPlaceholderScreen} />
    </Stack.Navigator>
  );
}