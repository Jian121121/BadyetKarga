import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

import SplashScreen from '../../features/auth/screens/SplashScreen';
import OnboardingScreen from '../../features/auth/screens/OnboardingScreen';
import LoginScreen from '../../features/auth/screens/LoginScreen';
import RegisterScreen from '../../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../../features/auth/screens/ForgotPasswordScreen';
import LegalDocumentScreen from '../../features/auth/screens/LegalScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    </Stack.Navigator>
  );
}
