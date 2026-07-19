import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding (3 pages placeholder)</Text>
      <Button
        title="Continue to Wizard Welcome"
        onPress={() => navigation.navigate('SetupWizardWelcome')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});