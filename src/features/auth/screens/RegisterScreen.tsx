import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    clearError();

    if (!fullName || !email || !password || !confirmPassword) {
      // We'll replace this with a proper inline validation UI later —
      // for now, a simple guard so we don't hit the database with empty fields.
      return;
    }
    if (password !== confirmPassword) {
      return;
    }

    await register(fullName, email, password);
    // Note: we do NOT manually navigate to MainTabs here.
    // RootNavigator will react to isAuthenticated becoming true
    // and switch screens automatically — built in the next step.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {password !== confirmPassword && confirmPassword.length > 0 && (
        <Text style={styles.errorText}>Passwords do not match.</Text>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Create Account" onPress={handleRegister} />
      )}

      <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#707a6c',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  errorText: { color: '#ba1a1a', textAlign: 'center' },
});