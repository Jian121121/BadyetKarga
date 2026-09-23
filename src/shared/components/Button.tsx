import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors, typography, spacing, radii } from '../theme';

type ButtonVariant = 'filled' | 'outlined' | 'text';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  label,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && styles.filled,
        variant === 'outlined' && styles.outlined,
        variant === 'text' && styles.text,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'filled' && styles.labelOnFilled,
            variant !== 'filled' && styles.labelOnLight,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  filled: {
    backgroundColor: colors.primary,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...typography.labelLg,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  labelOnFilled: {
    color: colors.onPrimary,
  },
  labelOnLight: {
    color: colors.primary,
  },
});