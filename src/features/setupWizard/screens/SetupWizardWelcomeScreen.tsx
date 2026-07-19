import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'SetupWizardWelcome'>;

export default function SetupWizardWelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup Wizard Welcome</Text>
      <Button title="Get Started (Register)" onPress={() => navigation.navigate('Register')} />
      <Button title="Sign In" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});