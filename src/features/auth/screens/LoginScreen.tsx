import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAuthStore } from '../../../store/authStore';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Card from '../../../shared/components/Card';
import FadeIn from '../../../shared/motion/FadeIn';
import TextInput from '../../../shared/components/TextInput';
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading, error, clearError, getRememberedLogin } = useAuthStore();

  useEffect(() => {
    void getRememberedLogin().then(({ email: saved, rememberMe: rem }) => {
      setRememberMe(rem);
      // Prefill email only when Remember Me was explicitly checked last login.
      setEmail(rem && saved ? saved : '');
    });
  }, []);

  const handleLogin = async () => {
    clearError();
    if (isLoading) return;
    if (!email.trim() || !password) return;
    await login(email.trim().toLowerCase(), password, rememberMe);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.blobGreen} />
      <View style={styles.blobGold} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn style={styles.form}>
            <View style={styles.hero}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="BadyetKarga"
                />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to manage your household budget</Text>
            </View>

            <Card style={styles.card}>
              <TextInput
                label="Email Address"
                value={email}
                placeholder="Enter your email"
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View>
                <TextInput
                  label="Password"
                  value={password}
                  placeholder="Enter your password"
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>

              <View style={styles.optionsRow}>
                <Pressable style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)}>
                  <MaterialIcons
                    name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={rememberMe ? colors.primary : colors.outline}
                  />
                  <Text style={styles.rememberLabel}>Remember Me</Text>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </Pressable>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={[styles.loginButton, isLoading && styles.loginDisabled]}
                onPress={() => void handleLogin()}
                disabled={isLoading}
              >
                <Text style={styles.loginLabel}>Login</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
              </Pressable>
            </Card>

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerRow}>
              <Text style={styles.registerText}>
                Don&apos;t have an account? <Text style={styles.registerLink}>Register</Text>
              </Text>
            </Pressable>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  blobGreen: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    left: -70,
    backgroundColor: colors.primaryContainer,
    opacity: 0.18,
  },
  blobGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 80,
    right: -50,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  hero: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logo: { width: 72, height: 72 },
  title: {
    ...typography.headlineLgMobile,
    width: '100%',
    color: colors.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    width: '100%',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: { width: '100%', gap: spacing.xs },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 36,
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rememberLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  forgot: { ...typography.labelLg, color: colors.primary },
  loginButton: {
    height: 52,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loginDisabled: { opacity: 0.5 },
  loginLabel: { ...typography.titleMd, color: colors.onPrimary },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  orLine: { flex: 1, height: 1, backgroundColor: colors.outlineVariant },
  orText: { ...typography.labelLg, color: colors.onSurfaceVariant },
  registerRow: { marginTop: spacing.md, alignItems: 'center' },
  registerText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  registerLink: { color: colors.primary, fontWeight: '700' },
  errorText: {
    ...typography.labelLg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});
