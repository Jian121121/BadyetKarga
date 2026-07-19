import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { colors, typography, spacing } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import TextInput from '../../../shared/components/TextInput';
import { Text } from 'react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    clearError();
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <Card style={styles.card}>
        <TextInput label="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button label="Login" onPress={handleLogin} loading={isLoading} style={styles.spacedButton} />
        <Button label="Forgot Password?" variant="text" onPress={() => navigation.navigate('ForgotPassword')} />
      </Card>

      <Button
        label="Don't have an account? Register"
        variant="text"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  spacedButton: {
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.labelLg,
    color: colors.error,
    textAlign: 'center',
  },
});