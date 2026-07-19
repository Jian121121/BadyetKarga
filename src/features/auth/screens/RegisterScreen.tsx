import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { fontSize: 20 },
});