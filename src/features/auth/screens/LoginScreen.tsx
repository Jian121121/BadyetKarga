import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Button title="Forgot Password?" onPress={() => navigation.navigate('ForgotPassword')} />
      <Button title="Don't have an account? Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});